sed -i -e '/submitAnswer: async (params: {/i \
  syncSessionState: async (sessionId: string, state: { currentIndex?: number, bookmarked?: any, needsReview?: any }): Promise<void> => {\n    await fetch(`/api/questions/session/${sessionId}/sync`, {\n      method: "POST",\n      headers: { "Content-Type": "application/json" },\n      body: JSON.stringify(state)\n    });\n  },\n' src/services/api.ts
