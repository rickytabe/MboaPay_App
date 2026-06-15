import React from "react";
import { Text, View } from "react-native";

type HeaderProps = {
  name: string;
  message: string;
};

const Header = ({ name, message }: HeaderProps) => {
  return (
    <View>
      <Text>Hello, {name}</Text>
      <Text>{message}</Text>
    </View>
  );
};

export default Header;