import { supabase } from "./supabase";
import * as FileSystem from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";

export const uploadAvatarToSupabase = async (uri: string, userId: string): Promise<string | null> => {
  try {
    const ext = uri.substring(uri.lastIndexOf(".") + 1);
    const fileName = `${userId}/avatar-${Date.now()}.${ext}`;

    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64',
    });

    const { data, error } = await supabase.storage
      .from("User_avaters")
      .upload(fileName, decode(base64), {
        contentType: `image/${ext}`,
        upsert: true,
      });

    if (error) {
      console.error("Upload error:", error);
      throw error;
    }

    return data.path;
  } catch (error) {
    console.error("Failed to upload image:", error);
    return null;
  }
};
