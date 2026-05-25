import React from "react";
import { render, screen } from "@testing-library/react";
import ChatInterface from "../../components/ChatInterface";

// Mock LearningWorkspace
jest.mock("../../components/LearningWorkspace", () => () => (
  <div data-testid="workspace">Learning Workspace Loaded</div>
));

describe("ChatInterface Integration Test", () => {
  test("ChatInterface loads workspace", () => {
    render(<ChatInterface />);
    expect(screen.getByTestId("workspace")).toBeInTheDocument();
  });
});