import { describe, it, expect } from "vitest";
import { getInitials, cn } from "../lib/utils";

describe("cn", () => {
  it("should merge class names correctly", () => {
    expect(cn("px-2 py-1", "bg-red-500")).toBe("px-2 py-1 bg-red-500");
  });

  it("should handle conditional class names", () => {
    expect(cn("px-2 py-1", true && "bg-red-500", false && "text-white")).toBe("px-2 py-1 bg-red-500");
  });

  it("should correctly resolve tailwind conflicts", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});

describe("getInitials", () => {
  it("should return 'U' if no name is provided", () => {
    expect(getInitials()).toBe("U");
    expect(getInitials(null)).toBe("U");
    expect(getInitials("")).toBe("U");
  });

  it("should return the first letter for a single name", () => {
    expect(getInitials("Anton")).toBe("A");
    expect(getInitials("jM")).toBe("J");
  });

  it("should return the first letter of the first two names", () => {
    expect(getInitials("Anton Developer")).toBe("AD");
    expect(getInitials("John Doe")).toBe("JD");
  });

  it("should handle multiple spaces and trim properly", () => {
    expect(getInitials("  Anton   Dev  ")).toBe("AD");
    expect(getInitials(" John   ")).toBe("J");
  });

  it("should return only two characters max for long names", () => {
    expect(getInitials("Anton The Great Developer")).toBe("AT");
    expect(getInitials("Mary Jane Watson")).toBe("MJ");
  });
});
