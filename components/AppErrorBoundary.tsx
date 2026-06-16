import React from "react";
import { View } from "react-native";
import StateNotice from "./StateNotice";

interface AppErrorBoundaryProps {
  children: React.ReactNode;
  onReset?: () => void;
}

interface AppErrorBoundaryState {
  error: Error | null;
}

export default class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("Unhandled app error:", error);
  }

  private reset = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1 }}>
          <StateNotice
            variant="error"
            icon="construct"
            title="Something needs attention"
            message="The app hit an unexpected problem. You can return to a stable screen and try the action again."
            actionLabel="Return Home"
            onAction={this.reset}
          />
        </View>
      );
    }

    return this.props.children;
  }
}
