const llm = require('./llmService');
const { buildPrompt } = require('./promptBuilder');
const { recommend } = require('./recommendationService');
const { compareTenures } = require('./emiService');
const { getAllProducts, getProductById } = require('./productService');
const { ValidationError } = require('../utils/errors');
const { DISCLAIMER } = require('../utils/constants');
const { inr } = require('../utils/format');

const MAX_MESSAGE_LEN = 1000;
const MAX_HISTORY = 6;

function cleanMessage(message) {
  if (typeof message !== 'string' || !message.trim()) throw new ValidationError('message is required');
  const m = message.trim();
  if (m.length > MAX_MESSAGE_LEN) throw new ValidationError(`message must be at most ${MAX_MESSAGE_LEN} characters`);
  return m;
}

// Keep only well-formed recent turns, trimmed in size (limits prompt abuse and cost).
function cleanHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter((h) => h && (h.role === 'user' || h.role === 'assistant') && typeof h.content === 'string' && h.content.trim())
    .slice(-MAX_HISTORY)
    .map((h) => ({ role: h.role, content: h.content.trim().slice(0, MAX_MESSAGE_LEN) }));
}

// Verified tenure trade-off numbers for the best-match product (computed in JS).
function tenureComparisonFor(result) {
  if (!result.bestMatchProductId) return null;
  const product = getProductById(result.bestMatchProductId);
  const best = result.recommendations.find((r) => r.productId === result.bestMatchProductId);
  const base = best.evaluatedTenureMonths;
  const candidates = [
    Math.max(product.minTenureMonths, Math.round(base / 2)),
    base,
    Math.min(product.maxTenureMonths, Math.round(base * 1.5)),
  ];
  const tenures = [...new Set(candidates)];
  if (tenures.length < 2) return null;
  return compareTenures({ principal: result.profile.loanAmount, annualRatePercent: product.annualInterestRate, tenures });
}

// Rule-based answer used when the AI is unavailable (no AI involved).
function fallbackReply(result) {
  const head = 'The AI assistant is temporarily unavailable, so here is a summary from our verified calculations.';
  if (!result) return `${head} Please complete your borrower profile to see verified results.`;
  const best = result.recommendations.find((r) => r.productId === result.bestMatchProductId);
  if (!best) {
    return `${head} Under the demo rules, none of the products appears fully eligible for this profile. Open the recommendation cards to see the reason for each.`;
  }
  return (
    `${head} The closest match under the demo rules is ${best.name}: estimated EMI ${inr(best.emi)} per month for ` +
    `${best.evaluatedTenureMonths} months, total interest ${inr(best.totalInterest)}, total repayment ${inr(best.totalRepayment)}.`
  );
}

/**
 * Answers one chat message.
 * @param {{message:string, profile?:object, history?:Array}} input
 * @param {{askLLM?:Function}} deps  injectable for tests
 */
async function answer({ message, profile, history }, deps = {}) {
  const askLLM = deps.askLLM || llm.askLLM;
  const text = cleanMessage(message);
  const turns = cleanHistory(history);

  // Ground the answer: run the deterministic engine on the user's profile.
  let result = null;
  let missingFields = [];
  if (profile && typeof profile === 'object' && Object.keys(profile).length) {
    try {
      result = recommend(profile);
    } catch (err) {
      if (err instanceof ValidationError) missingFields = err.details || [err.message];
      else throw err;
    }
  }
  const tenureComparison = result ? tenureComparisonFor(result) : null;

  const prompt = buildPrompt({ message: text, history: turns, result, tenureComparison, missingFields, catalog: getAllProducts() });

  const grounding = {
    profileUsed: Boolean(result),
    missingFields,
    bestMatchProductId: result ? result.bestMatchProductId : null,
  };

  try {
    const { text: reply } = await askLLM(prompt);
    return { reply, aiAvailable: true, disclaimer: DISCLAIMER, grounding };
  } catch (err) {
    if (err instanceof llm.LlmError) {
      return { reply: fallbackReply(result), aiAvailable: false, disclaimer: DISCLAIMER, grounding };
    }
    throw err;
  }
}

module.exports = { answer };
