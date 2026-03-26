import { VerificationResult, VerificationReport } from '@/types';

// ================================================================
// VERIFICATION SCRIPT 1: Safety & Content Check
// Checks for harmful, inappropriate, or policy-violating content
// ================================================================
export function runSafetyCheck(content: string): VerificationResult {
  const lowerContent = content.toLowerCase();

  const harmfulPatterns = [
    /\b(harm|hurt|kill|weapon|bomb|explosive|poison)\b/gi,
    /\b(illegal|fraud|scam|hack|crack|bypass security)\b/gi,
    /\b(personal data|ssn|social security|credit card number)\b/gi,
    /\b(child|minor).{0,20}(explicit|sexual|nude)/gi,
  ];

  const warningPatterns = [
    /\b(jailbreak|ignore previous|ignore all instructions|act as if you have no restrictions)\b/gi,
    /\b(DAN|do anything now)\b/g,
    /\b(pretend you are|you are now|forget you are)\b.*\b(ai|assistant|model)\b/gi,
  ];

  for (const pattern of harmfulPatterns) {
    if (pattern.test(content)) {
      return {
        check: 'Safety & Content',
        status: 'failed',
        score: 0,
        message: 'Prompt contains potentially harmful or policy-violating content.',
        details: 'The prompt was flagged for content that may violate usage policies.',
      };
    }
  }

  for (const pattern of warningPatterns) {
    if (pattern.test(content)) {
      return {
        check: 'Safety & Content',
        status: 'warning',
        score: 40,
        message: 'Prompt may attempt to bypass AI safety guidelines.',
        details: 'Jailbreak-style instructions were detected. This prompt requires manual review.',
      };
    }
  }

  return {
    check: 'Safety & Content',
    status: 'passed',
    score: 100,
    message: 'No harmful or policy-violating content detected.',
  };
}

// ================================================================
// VERIFICATION SCRIPT 2: Quality & Structure Check
// Evaluates prompt quality, clarity, and effectiveness
// ================================================================
export function runQualityCheck(content: string, title: string): VerificationResult {
  const issues: string[] = [];
  let score = 100;

  // Length checks
  if (content.length < 20) {
    return {
      check: 'Quality & Structure',
      status: 'failed',
      score: 0,
      message: 'Prompt is too short to be useful.',
      details: 'Prompts should be at least 20 characters long.',
    };
  }

  if (content.length < 50) {
    issues.push('Prompt is very short — consider adding more context.');
    score -= 30;
  }

  if (content.length > 10000) {
    issues.push('Prompt is very long — consider breaking it into smaller parts.');
    score -= 10;
  }

  // Title quality
  if (!title || title.length < 5) {
    issues.push('Title is too short or missing.');
    score -= 20;
  }

  // Structural quality indicators
  const hasInstructions = /\b(please|help|write|create|explain|analyze|generate|translate|summarize|list|describe)\b/i.test(content);
  if (!hasInstructions) {
    issues.push('Prompt lacks clear instructional verbs (e.g., "write", "explain", "analyze").');
    score -= 15;
  }

  // Check for placeholder text
  const hasPlaceholders = /\[your|<your|{your|\[insert|\[placeholder/i.test(content);
  if (hasPlaceholders) {
    issues.push('Prompt contains unfilled placeholders.');
    score -= 25;
  }

  // Repetition check
  const words = content.toLowerCase().split(/\s+/);
  const wordFreq: Record<string, number> = {};
  words.forEach(w => { wordFreq[w] = (wordFreq[w] || 0) + 1; });
  const repeatedWords = Object.entries(wordFreq).filter(([w, c]) => c > 5 && w.length > 4);
  if (repeatedWords.length > 3) {
    issues.push('Prompt has excessive word repetition.');
    score -= 10;
  }

  score = Math.max(0, Math.min(100, score));

  if (score >= 80) {
    return {
      check: 'Quality & Structure',
      status: 'passed',
      score,
      message: 'Prompt meets quality standards.',
      details: issues.length > 0 ? issues.join(' ') : undefined,
    };
  } else if (score >= 50) {
    return {
      check: 'Quality & Structure',
      status: 'warning',
      score,
      message: 'Prompt has some quality issues.',
      details: issues.join(' '),
    };
  } else {
    return {
      check: 'Quality & Structure',
      status: 'failed',
      score,
      message: 'Prompt does not meet minimum quality standards.',
      details: issues.join(' '),
    };
  }
}

// ================================================================
// VERIFICATION SCRIPT 3: Originality & Uniqueness Check
// Checks for spam, duplicates, and generic filler content
// ================================================================
export function runOriginalityCheck(content: string): VerificationResult {
  const spamPhrases = [
    'lorem ipsum',
    'test test test',
    'hello world',
    'asdf',
    'qwerty',
    'aaaa',
    'bbbb',
    '1234',
  ];

  const lowerContent = content.toLowerCase();

  for (const phrase of spamPhrases) {
    if (lowerContent.includes(phrase)) {
      return {
        check: 'Originality',
        status: 'failed',
        score: 0,
        message: 'Prompt appears to be test/spam content.',
        details: `Contains filler text: "${phrase}"`,
      };
    }
  }

  // Check for pure copy-paste repetition (same sentence repeated)
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const uniqueSentences = new Set(sentences.map(s => s.trim().toLowerCase()));
  if (sentences.length > 3 && uniqueSentences.size < sentences.length * 0.6) {
    return {
      check: 'Originality',
      status: 'warning',
      score: 40,
      message: 'Prompt contains highly repetitive sentences.',
      details: 'Many sentences appear to be duplicated. Consider reviewing the content.',
    };
  }

  // Check for minimal unique content ratio
  const uniqueWordRatio = new Set(content.toLowerCase().split(/\s+/)).size /
    content.split(/\s+/).length;

  if (uniqueWordRatio < 0.3 && content.split(/\s+/).length > 20) {
    return {
      check: 'Originality',
      status: 'warning',
      score: 50,
      message: 'Low unique word ratio detected.',
      details: 'The prompt may be overly repetitive.',
    };
  }

  return {
    check: 'Originality',
    status: 'passed',
    score: 100,
    message: 'Prompt appears original and non-repetitive.',
  };
}

// ================================================================
// RUN ALL CHECKS
// ================================================================
export function verifyPrompt(content: string, title: string): VerificationReport {
  const results: VerificationResult[] = [
    runSafetyCheck(content),
    runQualityCheck(content, title),
    runOriginalityCheck(content),
  ];

  const overallScore = Math.round(
    results.reduce((sum, r) => sum + r.score, 0) / results.length
  );

  const hasFailed = results.some(r => r.status === 'failed');
  const hasWarning = results.some(r => r.status === 'warning');

  const overallStatus = hasFailed ? 'failed' : hasWarning ? 'warning' : 'passed';

  return {
    overall_score: overallScore,
    overall_status: overallStatus,
    results,
    checked_at: new Date().toISOString(),
  };
}

export function getStatusFromScore(score: number): 'pending' | 'approved' | 'rejected' {
  if (score >= 70) return 'approved';
  if (score >= 40) return 'pending'; // needs manual review
  return 'rejected';
}
