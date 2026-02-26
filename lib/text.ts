export function countWords(text: string): number {
  const parts = text.trim().split(/\s+/).filter(Boolean);
  return text.trim() ? parts.length : 0;
}

function isSentencePunctuation(char: string): boolean {
  return /[.!?。！？]/.test(char);
}

export function extractContextSentence(params: {
  fullText: string;
  startIndex: number;
  endIndex: number;
  selectedText: string;
}): string {
  const { fullText, startIndex, endIndex, selectedText } = params;

  if (!fullText) {
    return selectedText;
  }

  const ranges: Array<{ start: number; end: number }> = [];
  let sentenceStart = 0;

  for (let i = 0; i < fullText.length; i += 1) {
    if (isSentencePunctuation(fullText[i])) {
      ranges.push({ start: sentenceStart, end: i + 1 });
      sentenceStart = i + 1;
    }
  }

  if (sentenceStart < fullText.length) {
    ranges.push({ start: sentenceStart, end: fullText.length });
  }

  const matched = ranges.find((range) => {
    const overlaps = startIndex < range.end && endIndex > range.start;
    return overlaps;
  });

  if (matched) {
    const sentence = fullText.slice(matched.start, matched.end).trim();
    if (sentence) {
      return sentence;
    }
  }

  const fallbackStart = Math.max(0, startIndex - 120);
  const fallbackEnd = Math.min(fullText.length, endIndex + 120);
  return fullText.slice(fallbackStart, fallbackEnd).trim() || selectedText;
}
