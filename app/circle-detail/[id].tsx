import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import { Alert, Clipboard, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import Button from "../../components/Button";
import Card from "../../components/Card";
import InitialsAvatar from "../../components/InitialsAvatar";
import TopNavBarComponent from "../../components/TopNavBarComponent";
import { LIGHT_COLORS, ROUNDED, SPACING, TYPOGRAPHY } from "../../constants/Theme";
import { useApp } from "../../context/AppContext";
import { supabase } from "../../lib/supabase";
import { checkAndTriggerDisbursement } from "../../lib/circleDisbursement";

const formatTimestamp = (ts: string) => {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

export default function CircleDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { circles, payCircleContribution, user, colors } = useApp();
  const styles = getStyles(colors);

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("Overview");

  // Realtime Data states
  const [activities, setActivities] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [roundData, setRoundData] = useState<{ members: any[]; paidCount: number; recipientId: string | null; currentRound: number }>({ members: [], paidCount: 0, recipientId: null, currentRound: 1 });
  const [myTotalContributed, setMyTotalContributed] = useState(0);
  const [poolTotalContributed, setPoolTotalContributed] = useState(0);

  const circleId = params.id as string;
  const circle = circles.find((c) => c.id === circleId);

  useEffect(() => {
    if (!circleId || !circle) return;
    
    fetchCircleData();

    const channel = supabase.channel(`circle_${circleId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contributions', filter: `circle_id=eq.${circleId}` }, () => {
        fetchCircleData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'disbursements', filter: `circle_id=eq.${circleId}` }, () => {
        fetchCircleData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'circle_members', filter: `circle_id=eq.${circleId}` }, () => {
        fetchCircleData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [circleId]);

  const fetchCircleData = async () => {
    try {
      const resolveAvatar = async (avatarUrl: string | undefined) => {
        if (!avatarUrl) return undefined;
        if (avatarUrl.startsWith("http")) return avatarUrl;
        const { data } = await supabase.storage.from("User_avaters").createSignedUrl(avatarUrl, 60 * 60 * 24 * 7);
        return data?.signedUrl || avatarUrl;
      };

      // Fetch the circle type directly from DB to avoid stale closure issues
      const { data: circleRow } = await supabase.from('circles').select('circle_type, target_amount').eq('id', circleId).single();
      const circleType = circleRow?.circle_type as string | undefined;
      const targetAmount = circleRow?.target_amount || 0;

      // 1. Fetch Contributions & Disbursements for Activity
      const { data: contribs } = await supabase.from('contributions').select('*, circle_members(user_id, users(full_name, avatar_url))').eq('circle_id', circleId).order('created_at', { ascending: false });
      const { data: disburse } = await supabase.from('disbursements').select('*, users(full_name, avatar_url)').eq('circle_id', circleId).order('created_at', { ascending: false });

      const mappedActivity = await Promise.all([
        ...(contribs || []).map(async (c: any) => ({
          id: c.id,
          type: 'contribution',
          amount: c.amount,
          status: c.status,
          date: c.created_at,
          userName: c.circle_members?.users?.full_name || 'Member',
          avatarUrl: await resolveAvatar(c.circle_members?.users?.avatar_url),
        })),
        ...(disburse || []).map(async (d: any) => ({
          id: d.id,
          type: 'disbursement',
          amount: d.amount,
          status: d.status,
          date: d.created_at,
          userName: d.users?.full_name || 'Member',
          avatarUrl: await resolveAvatar(d.users?.avatar_url),
        }))
      ]);
      mappedActivity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setActivities(mappedActivity);

      // 2. Fetch Leaderboard (Pool / Solo)
      if (circleType === 'pool' || circleType === 'solo') {
        const memberTotals = new Map<string, number>();
        let totalPool = 0;
        (contribs || []).forEach((c: any) => {
          if (c.status === 'successful' || c.status === 'COMPLETED') {
            const memberId = c.member_id;
            memberTotals.set(memberId, (memberTotals.get(memberId) || 0) + Number(c.amount));
            totalPool += Number(c.amount);
          }
        });
        setPoolTotalContributed(totalPool);

        const { data: members } = await supabase.from('circle_members').select('id, user_id, users(full_name, avatar_url)').eq('circle_id', circleId);
        
        const board = await Promise.all((members || []).map(async (m: any) => {
          const uData = Array.isArray(m.users) ? m.users[0] : m.users;
          return {
            ...m,
            userId: m.user_id,
            name: m.user_id === user.id ? 'You' : (uData?.full_name || 'Member'),
            avatar: await resolveAvatar(uData?.avatar_url),
            total: memberTotals.get(m.id) || 0,
          };
        }));
        board.sort((a, b) => b.total - a.total);

        setLeaderboard(board);
        
        const myData = board.find(b => b.userId === user.id);
        if (myData) setMyTotalContributed(myData.total);
      }

      // 3. Fetch Round Data (Rotation)
      if (circleType === 'rotation') {
        const currentRound = disburse && disburse.length > 0 ? (disburse[0].round_number || 0) + 1 : 1;
        
        const { data: members } = await supabase.from('circle_members')
          .select('id, user_id, rotation_order, member_status, users(full_name, avatar_url)')
          .eq('circle_id', circleId)
          .eq('member_status', 'active')
          .order('rotation_order', { ascending: true });

        const activeMembers = members || [];
        const paidThisRound = (contribs || []).filter(c => Number(c.cycle_number) === Number(currentRound) && (c.status === 'successful' || c.status === 'COMPLETED'));
        const paidSet = new Set(paidThisRound.map(c => c.member_id));

        const zeroIndex = (currentRound - 1) % (activeMembers.length || 1);
        const recipient = activeMembers[zeroIndex];

        const roundMem = await Promise.all(activeMembers.map(async (m: any) => {
          const uData = Array.isArray(m.users) ? m.users[0] : m.users;
          return {
            ...m,
            name: m.user_id === user.id ? 'You' : (uData?.full_name || 'Member'),
            avatar: await resolveAvatar(uData?.avatar_url),
            hasPaid: paidSet.has(m.id)
          };
        }));

        setRoundData({
          members: roundMem,
          paidCount: paidSet.size,
          recipientId: recipient ? recipient.id : null,
          currentRound
        });
      }

    } catch (error) {
      console.warn("Failed to fetch live circle data", error);
    }
  };

  if (!circle) {
    return (
      <View style={styles.errorContainer}>
        <TopNavBarComponent showBack title="Not Found" />
        <Text style={styles.errorText}>Savings Circle not found</Text>
      </View>
    );
  }

  const isSolo = circle.rawType === 'solo';
  const isPool = circle.rawType === 'pool';
  const isRotation = circle.rawType === 'rotation';

  const userMember = circle.members.find((m) => m.name === "You" || m.name === "You (Pending)");
  const isPendingMember = userMember?.isPending;
  
  // Calculate if the user has paid / can pay based on real data
  let userHasPaid = false;
  if (isRotation) {
    // For rotation, check if they have paid in the CURRENT round
    const roundMe = roundData.members.find(m => m.user_id === user.id);
    userHasPaid = roundMe ? roundMe.hasPaid : false;
  } else {
    // For Pool and Solo, they can always contribute until the goal is fully met!
    userHasPaid = myTotalContributed >= circle.goalAmount;
  }

  const handlePay = async () => {
    setLoading(true);
    try {
      await payCircleContribution(circleId);
      Alert.alert("Success", "Contribution paid successfully from your wallet balance.");
    } catch (e: any) {
      console.log(e);
      Alert.alert("Error", e.message || "Insufficient wallet balance or payment failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualDisburse = async () => {
    Alert.alert(
      "Confirm Manual Disbursement",
      "Triggering a manual disbursement will bypass auto-conditions and send payouts now. Proceed?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            setLoading(true);
            try {
               await checkAndTriggerDisbursement(circleId, userMember?.id);
               Alert.alert("Success", "Disbursement triggered.");
            } catch(e: any) {
               Alert.alert("Error", e.message);
            } finally {
               setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCopyCode = () => {
    Clipboard.setString(circle.code);
    Alert.alert("Code Copied", `Invite code "${circle.code}" copied to clipboard.`);
  };

  const tabs = ["Overview"];
  if (isRotation) tabs.push("Round");
  if (!isSolo) tabs.push("Members");
  tabs.push("Activity");

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <TopNavBarComponent showBack title={circle.name} />

      <View style={styles.headerInfo}>
        <View style={styles.badgeRow}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{isSolo ? 'SOLO SAVINGS' : isRotation ? 'TONTINE' : 'POOL'}</Text>
          </View>
          {circle.isTreasurer && !isSolo && (
            <View style={styles.treasurerBadge}>
              <Text style={styles.treasurerBadgeText}>Treasurer</Text>
            </View>
          )}
        </View>
        {!isSolo && (
          <TouchableOpacity onPress={handleCopyCode} style={styles.codeContainer}>
            <Text style={styles.codeLabel}>Invite Code:</Text>
            <Text style={styles.codeText}>{circle.code}</Text>
            <Ionicons name="copy-outline" size={14} color={colors.primaryContainer} />
          </TouchableOpacity>
        )}
      </View>

      {/* Shared Stats Block */}
      <View style={styles.statsBlock}>
        <View style={styles.statGroup}>
          <Text style={styles.statLabel}>Contribution</Text>
          <Text style={styles.statValue}>{circle.contributionAmount.toLocaleString()} XAF</Text>
        </View>
        <View style={styles.statGroup}>
          <Text style={styles.statLabel}>Frequency</Text>
          <Text style={styles.statValue}>{circle.frequency}</Text>
        </View>
        <View style={styles.statGroup}>
          <Text style={styles.statLabel}>Target Pool</Text>
          <Text style={styles.statValue}>{circle.goalAmount.toLocaleString()} XAF</Text>
        </View>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabsContainer}>
        {tabs.map(tab => (
          <TouchableOpacity key={tab} style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* TAB: OVERVIEW */}
      {activeTab === "Overview" && (
        <View style={styles.tabContent}>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10 }}>
            <TouchableOpacity onPress={() => fetchCircleData()} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="refresh" size={14} color={colors.primaryContainer} />
              <Text style={{ color: colors.primaryContainer, fontSize: 12, fontWeight: '700' }}>Refresh Data</Text>
            </TouchableOpacity>
          </View>
          {isPendingMember ? (
            <View style={styles.pendingInfoBox}>
              <Ionicons name="time-outline" size={20} color={colors.primary} />
              <Text style={styles.pendingInfoText}>Your membership is pending approval.</Text>
            </View>
          ) : !userHasPaid ? (
            <Button title={`Pay Contribution (${circle.contributionAmount.toLocaleString()} XAF)`} onPress={handlePay} loading={loading} type="primary" />
          ) : (
             <View style={styles.paidInfoBox}>
              <Ionicons name="checkmark-circle" size={20} color={colors.secondary} />
              <Text style={styles.paidInfoText}>{isRotation ? "Your contribution for this cycle is paid" : "You have reached your savings goal!"}</Text>
            </View>
          )}

          <Card variant="outlined" style={{ marginTop: 20 }}>
            {isSolo || isPool ? (
               <View>
                 <Text style={styles.sectionTitle}>{isPool ? "Pool Progress" : "Your Progress"}</Text>
                 <Text style={styles.progressText}>{(isPool ? poolTotalContributed : myTotalContributed).toLocaleString()} / {circle.goalAmount.toLocaleString()} XAF</Text>
                 <View style={styles.progressBarBg}>
                   <View style={[styles.progressBarFill, { width: `${Math.min(100, ((isPool ? poolTotalContributed : myTotalContributed) / circle.goalAmount) * 100)}%` }]} />
                 </View>
               </View>
            ) : (
               <View>
                 <Text style={styles.sectionTitle}>Round {roundData.currentRound} Progress</Text>
                 <Text style={styles.progressText}>{roundData.paidCount} of {roundData.members.length} members paid ({(roundData.paidCount * circle.contributionAmount).toLocaleString()} XAF)</Text>
                 <View style={styles.progressBarBg}>
                   <View style={[styles.progressBarFill, { width: `${Math.min(100, roundData.members.length ? (roundData.paidCount / roundData.members.length) * 100 : 0)}%` }]} />
                 </View>
               </View>
            )}
          </Card>

          {circle.isTreasurer && (
             <Button title="Manual Disbursement" onPress={handleManualDisburse} loading={loading} type="secondary" style={{ marginTop: 20 }} />
          )}
        </View>
      )}

      {/* TAB: ROUND (Rotation Only) */}
      {activeTab === "Round" && isRotation && (
        <View style={styles.tabContent}>
          <Text style={styles.sectionTitle}>Round {roundData.currentRound} Order</Text>
          <Card variant="outlined" noPadding>
            {roundData.members.map((m, idx) => (
              <View key={m.id}>
                <View style={[styles.memberRow, m.id === roundData.recipientId && styles.amberHighlightRow]}>
                  <View style={styles.memberLeft}>
                     {m.avatar ? <Image source={{ uri: m.avatar }} style={styles.memberAvatar} /> : <InitialsAvatar name={m.name} size={36} />}
                     <Text style={[styles.memberName, m.id === roundData.recipientId && styles.amberText]}>{m.name}</Text>
                  </View>
                  <View style={styles.memberRight}>
                     {m.hasPaid ? (
                        <View style={styles.statusDotGreen} />
                     ) : (
                        <View style={styles.statusDotGray} />
                     )}
                  </View>
                </View>
                {idx < roundData.members.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </Card>
        </View>
      )}

      {/* TAB: MEMBERS (Leaderboard for Pool, Simple for Rotation) */}
      {activeTab === "Members" && !isSolo && (
        <View style={styles.tabContent}>
          {isPool ? (
            <>
              <Text style={styles.sectionTitle}>Leaderboard</Text>
              <Card variant="outlined" noPadding>
                {leaderboard.map((m, idx) => (
                  <View key={m.memberId}>
                    <View style={[styles.memberRow, m.userId === user.id && styles.myHighlightRow]}>
                      <View style={[styles.memberLeft, { flex: 1 }]}>
                         <Text style={[styles.rankText, idx === 0 && styles.amberText]}>#{idx + 1}</Text>
                         {m.avatar ? <Image source={{ uri: m.avatar }} style={styles.memberAvatar} /> : <InitialsAvatar name={m.name} size={36} />}
                         <View style={{ flex: 1 }}>
                           <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                             <Text style={styles.memberName}>{m.name}</Text>
                             <Text style={styles.statLabel}>{m.total.toLocaleString()} XAF</Text>
                           </View>
                           <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                             <View style={[styles.progressBarBg, { flex: 1, height: 6 }]}>
                               <View style={[styles.progressBarFill, { width: `${Math.min(100, circle.goalAmount > 0 ? (m.total / circle.goalAmount) * 100 : 0)}%` }]} />
                             </View>
                             <Text style={{ fontSize: 10, color: colors.onSurfaceVariant, fontWeight: '700' }}>
                               {circle.goalAmount > 0 ? ((m.total / circle.goalAmount) * 100).toFixed(0) : 0}%
                             </Text>
                           </View>
                         </View>
                      </View>
                    </View>
                    {idx < leaderboard.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </Card>
            </>
          ) : (
            <Card variant="outlined" noPadding>
              {circle.members.map((m, idx) => (
                 <View key={idx}>
                   <View style={styles.memberRow}>
                     <View style={styles.memberLeft}>
                        {m.avatar ? <Image source={{ uri: m.avatar }} style={styles.memberAvatar} /> : <InitialsAvatar name={m.name} size={36} />}
                        <Text style={styles.memberName}>{m.name}</Text>
                     </View>
                   </View>
                   {idx < circle.members.length - 1 && <View style={styles.divider} />}
                 </View>
              ))}
            </Card>
          )}
        </View>
      )}

      {/* TAB: ACTIVITY */}
      {activeTab === "Activity" && (
        <View style={styles.tabContent}>
          <Card variant="outlined" noPadding>
             {activities.length > 0 ? activities.map((act, idx) => (
               <View key={act.id}>
                 <View style={styles.activityRow}>
                   <View style={styles.memberLeft}>
                      {act.avatarUrl ? <Image source={{ uri: act.avatarUrl }} style={styles.memberAvatar} /> : <InitialsAvatar name={act.userName} size={36} />}
                      <View>
                        <Text style={styles.memberName}>{act.userName}</Text>
                        <Text style={styles.statLabel}>{formatTimestamp(act.date)}</Text>
                      </View>
                   </View>
                   <View style={styles.memberRight}>
                      <Text style={[styles.memberName, { color: act.type === 'disbursement' ? colors.primary : colors.secondary }]}>
                        {act.type === 'disbursement' ? '+' : '-'}{act.amount.toLocaleString()}
                      </Text>
                      <View style={[
                        styles.statusPill, 
                        act.status === 'successful' ? styles.bgGreen : act.status === 'failed' ? styles.bgRed : styles.bgGray
                      ]}>
                         <Text style={[
                           styles.statusPillText,
                           act.status === 'successful' ? styles.textGreen : act.status === 'failed' ? styles.textRed : styles.textGray
                         ]}>{act.status}</Text>
                      </View>
                   </View>
                 </View>
                 {idx < activities.length - 1 && <View style={styles.divider} />}
               </View>
             )) : (
               <View style={styles.emptyContainer}>
                 <Text style={styles.statLabel}>No activity yet.</Text>
               </View>
             )}
          </Card>
        </View>
      )}

    </ScrollView>
  );
}

const getStyles = (colors: typeof LIGHT_COLORS) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  contentContainer: { paddingHorizontal: SPACING.containerPadding, paddingTop: 50, paddingBottom: 40 },
  errorContainer: { flex: 1, paddingHorizontal: SPACING.containerPadding, paddingTop: 50, alignItems: "center" },
  errorText: { marginTop: 40, fontSize: TYPOGRAPHY.bodyLg.fontSize, color: colors.error, fontWeight: "700" },
  
  headerInfo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16, marginBottom: 16 },
  badgeRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  typeBadge: { backgroundColor: colors.surfaceContainer, paddingVertical: 4, paddingHorizontal: 8, borderRadius: ROUNDED.sm },
  typeBadgeText: { fontSize: 10, fontWeight: "800", color: colors.onSurfaceVariant, letterSpacing: 0.5 },
  treasurerBadge: { backgroundColor: colors.primaryContainer + "15", paddingVertical: 4, paddingHorizontal: 8, borderRadius: ROUNDED.sm },
  treasurerBadgeText: { fontSize: 10, fontWeight: "800", color: colors.primaryContainer },
  
  codeContainer: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surfaceContainer, paddingVertical: 6, paddingHorizontal: 12, borderRadius: ROUNDED.md, gap: 6 },
  codeLabel: { fontSize: 11, color: colors.onSurfaceVariant, fontWeight: "600" },
  codeText: { fontSize: 13, fontWeight: "800", color: colors.primary },

  statsBlock: { flexDirection: "row", justifyContent: "space-between", backgroundColor: colors.surfaceContainer, padding: 16, borderRadius: ROUNDED.md, marginBottom: 20 },
  statGroup: { gap: 4 },
  statLabel: { fontSize: 11, color: colors.onSurfaceVariant, fontWeight: "600" },
  statValue: { fontSize: 14, fontWeight: "700", color: colors.primary },

  tabsContainer: { flexDirection: "row", backgroundColor: colors.surfaceContainer, borderRadius: ROUNDED.md, padding: 3, marginBottom: 20 },
  tabButton: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: ROUNDED.default },
  tabButtonActive: { backgroundColor: colors.surface },
  tabText: { fontSize: 13, fontWeight: "700", color: colors.onSurfaceVariant },
  tabTextActive: { color: colors.primaryContainer },
  tabContent: { gap: 16 },

  pendingInfoBox: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: colors.primaryContainer + "15", paddingVertical: 14, borderRadius: ROUNDED.md, gap: 8 },
  pendingInfoText: { color: colors.primary, fontWeight: "700", fontSize: 13 },
  paidInfoBox: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: colors.secondary + "15", paddingVertical: 14, borderRadius: ROUNDED.md, gap: 8 },
  paidInfoText: { color: colors.secondary, fontWeight: "700", fontSize: 13 },

  sectionTitle: { fontSize: 15, fontWeight: "700", color: colors.primary, marginBottom: 8 },
  progressText: { fontSize: 13, fontWeight: "700", color: colors.primary, marginBottom: 8 },
  progressBarBg: { height: 8, backgroundColor: colors.surfaceContainer, borderRadius: ROUNDED.full, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: colors.secondary },

  memberRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, paddingHorizontal: SPACING.md },
  activityRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, paddingHorizontal: SPACING.md },
  memberLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  memberAvatar: { width: 36, height: 36, borderRadius: 18 },
  memberName: { fontSize: 13, fontWeight: "700", color: colors.primary },
  memberRight: { alignItems: "flex-end", gap: 4 },

  rankText: { fontSize: 14, fontWeight: "800", color: colors.onSurfaceVariant, width: 24 },
  amberText: { color: colors.tertiaryContainer },
  amberHighlightRow: { backgroundColor: colors.tertiaryContainer + "10" },
  myHighlightRow: { backgroundColor: colors.secondary + "10" },

  statusDotGreen: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.secondary },
  statusDotGray: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: colors.outlineVariant },

  statusPill: { paddingVertical: 2, paddingHorizontal: 6, borderRadius: ROUNDED.sm },
  statusPillText: { fontSize: 9, fontWeight: "800", textTransform: 'uppercase' },
  bgGreen: { backgroundColor: colors.secondary + '15' }, textGreen: { color: colors.secondary },
  bgRed: { backgroundColor: colors.error + '15' }, textRed: { color: colors.error },
  bgGray: { backgroundColor: colors.surfaceContainer }, textGray: { color: colors.onSurfaceVariant },

  divider: { height: 1, backgroundColor: colors.surfaceContainer },
  emptyContainer: { padding: 30, alignItems: 'center' }
});
