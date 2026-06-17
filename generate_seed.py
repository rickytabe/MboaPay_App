import uuid
import random
from datetime import datetime, timedelta

def main():
    users = []
    for i in range(1, 26):
        uid = str(uuid.uuid4())
        phone = f'+2376{random.randint(70000000, 99999999)}'
        # Using a reliable placeholder image service
        avatar = f'https://api.dicebear.com/7.x/avataaars/svg?seed={uid}'
        name = f'Demo User {i}'
        users.append({'id': uid, 'name': name, 'phone': phone, 'avatar': avatar})

    sql = '-- Supabase Demo Seed Script\n\n'
    
    sql += '-- 1. Create auth.users and public.users\n'
    for u in users:
        # Minimal auth.users insert
        sql += f"INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token) VALUES ('00000000-0000-0000-0000-000000000000', '{u['id']}', 'authenticated', 'authenticated', 'user{u['id'][:8]}@demo.com', '', now(), now(), now(), '{{}}', '{{}}', now(), now(), '', '', '', '') ON CONFLICT (id) DO NOTHING;\n"
        
        sql += f"INSERT INTO public.users (id, full_name, phone, mno_provider, status, avatar_url, email) VALUES ('{u['id']}', '{u['name']}', '{u['phone']}', 'MTN', 'active', '{u['avatar']}', 'user{u['id'][:8]}@demo.com') ON CONFLICT (id) DO NOTHING;\n"

    # Wallets
    sql += '\n-- 2. Create wallets for users\n'
    for u in users:
        sql += f"INSERT INTO public.wallets (user_id, balance) VALUES ('{u['id']}', 1000000) ON CONFLICT (user_id) DO NOTHING;\n"

    # 3. Create 3 Circles
    solo_id = str(uuid.uuid4())
    pool_id = str(uuid.uuid4())
    rotation_id = str(uuid.uuid4())

    sql += '\n-- 3. Create Circles\n'
    # Solo
    sql += f"INSERT INTO public.circles (id, name, circle_type, target_amount, contribution_amount, frequency, visibility, max_members, invite_code, created_by) VALUES ('{solo_id}', 'My Macbook Fund', 'solo', 1000000, 50000, 'monthly', 'private', 1, '{str(uuid.uuid4())[:6].upper()}', '{users[0]['id']}');\n"
    # Pool
    sql += f"INSERT INTO public.circles (id, name, circle_type, target_amount, contribution_amount, frequency, visibility, max_members, invite_code, created_by) VALUES ('{pool_id}', 'Family Vacation', 'pool', 2000000, 25000, 'weekly', 'public', 10, '{str(uuid.uuid4())[:6].upper()}', '{users[1]['id']}');\n"
    # Rotation
    sql += f"INSERT INTO public.circles (id, name, circle_type, target_amount, contribution_amount, frequency, visibility, max_members, invite_code, created_by, commitment_deposit_percentage) VALUES ('{rotation_id}', 'Dschang Alumni Njangi', 'rotation', 0, 50000, 'monthly', 'private', 25, '{str(uuid.uuid4())[:6].upper()}', '{users[5]['id']}', 15);\n"

    sql += '\n-- 4. Create Circle Members\n'
    # Solo member
    sql += f"INSERT INTO public.circle_members (circle_id, user_id, role, member_status) VALUES ('{solo_id}', '{users[0]['id']}', 'admin', 'active');\n"
    
    # Pool members (Users 2 to 5)
    sql += f"INSERT INTO public.circle_members (circle_id, user_id, role, member_status) VALUES ('{pool_id}', '{users[1]['id']}', 'admin', 'active');\n"
    for i in range(2, 5):
        sql += f"INSERT INTO public.circle_members (circle_id, user_id, role, member_status) VALUES ('{pool_id}', '{users[i]['id']}', 'member', 'active');\n"

    # Rotation members (All 25 users)
    sql += f"INSERT INTO public.circle_members (circle_id, user_id, role, member_status, rotation_order, commitment_deposit) VALUES ('{rotation_id}', '{users[5]['id']}', 'admin', 'active', 1, 7500);\n"
    order = 2
    for i in range(25):
        if i == 5: continue # Admin
        sql += f"INSERT INTO public.circle_members (circle_id, user_id, role, member_status, rotation_order, commitment_deposit) VALUES ('{rotation_id}', '{users[i]['id']}', 'member', 'active', {order}, 7500);\n"
        order += 1

    sql += '\n-- 5. Simulate Rotation Workflow (Round 1)\n'
    # Everyone pays commitment deposit
    for u in users:
        sql += f"INSERT INTO public.contributions (circle_id, user_id, amount, status, cycle_number, reference) VALUES ('{rotation_id}', '{u['id']}', 7500, 'successful', 0, '{str(uuid.uuid4())}');\n"
    
    # Round 1 payments (Everyone pays 50000)
    for u in users:
        sql += f"INSERT INTO public.contributions (circle_id, user_id, amount, status, cycle_number, reference) VALUES ('{rotation_id}', '{u['id']}', 50000, 'successful', 1, '{str(uuid.uuid4())}');\n"

    # Round 1 Disbursement to Admin (rotation_order 1)
    disbursement_id = str(uuid.uuid4())
    sql += f"INSERT INTO public.disbursements (id, circle_id, recipient_id, amount, status, trigger_type, round_number) VALUES ('{disbursement_id}', '{rotation_id}', '{users[5]['id']}', {50000 * 25}, 'successful', 'auto', 1);\n"
    
    # Transaction for disbursement
    sql += f"INSERT INTO public.transactions (user_id, amount, type, status, reference, description) VALUES ('{users[5]['id']}', {50000 * 25}, 'disbursement', 'successful', '{disbursement_id}', 'Round 1 Payout from Dschang Alumni Njangi');\n"

    sql += '\n-- 6. Add some Pool contributions\n'
    for i in range(1, 5):
        sql += f"INSERT INTO public.contributions (circle_id, user_id, amount, status, cycle_number, reference) VALUES ('{pool_id}', '{users[i]['id']}', 25000, 'successful', 1, '{str(uuid.uuid4())}');\n"
        sql += f"INSERT INTO public.contributions (circle_id, user_id, amount, status, cycle_number, reference) VALUES ('{pool_id}', '{users[i]['id']}', 25000, 'successful', 2, '{str(uuid.uuid4())}');\n"

    sql += '\n-- 7. Add Solo contributions\n'
    sql += f"INSERT INTO public.contributions (circle_id, user_id, amount, status, cycle_number, reference) VALUES ('{solo_id}', '{users[0]['id']}', 50000, 'successful', 1, '{str(uuid.uuid4())}');\n"

    with open('demo_seed.sql', 'w') as f:
        f.write(sql)

if __name__ == '__main__':
    main()
