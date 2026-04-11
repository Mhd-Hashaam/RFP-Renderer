import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BlockRenderer } from "./BlockRenderer";

describe("BlockRenderer", () => {
  it("renders a paragraph", () => {
    render(
      <BlockRenderer
        block={{
          id: "p1",
          type: "paragraph",
          content: "Hello world",
        }}
        onUpdateHeading={vi.fn()}
        onUpdateParagraph={vi.fn()}
        onUpdateListItem={vi.fn()}
      />,
    );

    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });
});
