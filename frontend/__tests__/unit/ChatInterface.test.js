import React from "react";
import { render, screen } from "@testing-library/react";
import ChatInterface from "../../components/ChatInterface";
import LearningWorkspace from "../../components/LearningWorkspace";

// Mock the LearningWorkspace so Jest can test it safely
jest.mock("../../components/LearningWorkspace", () => () => (
  <div data-testid="workspace">Workspace Loaded</div>
));

describe("ChatInterface Component", () => {
  test("renders LearningWorkspace", () => {
    render(<ChatInterface />);
    const workspace = screen.getByTestId("workspace");
    expect(workspace).toBeInTheDocument();
  });
});