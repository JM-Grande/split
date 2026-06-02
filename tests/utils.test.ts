import { describe, it, expect } from "vitest";
import { getInitials } from "../lib/utils";

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
