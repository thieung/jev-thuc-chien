// Use case: while scrolling X, hide posts that are not worth opening. keep = concrete, applicable detail
// about AI coding agents. dataset.jsonl here is SYNTHETIC: 51 posts written by the author, each imitating a kind
// of post from the 51 real X posts measured in the article in new words, with the same label, language and tag mix. The real posts are other people's
// content and are not published, so numbers you get on this set will differ from the article.
// Pattern from @redp314 (one Jev call, several typed answers, code maps them to an action).
import { callJev, noul, score } from '../../lib/jev-client.mjs';
import { callGemini } from '../../lib/gemini-client.mjs';

const INTEREST = 'Building with AI coding agents (Claude Code, Codex, Cursor, MCP, hooks, subagents, AGENTS.md): concrete settings, commands, tools, measurements, postmortems.';

const questions = {
  on_topic: noul(
    'Is the main subject of `post` within `interest`?',
    'the post is mainly about using or building AI coding agents',
    'the post is about something else, or only mentions an AI tool in passing (news, finance, jokes, unrelated ads)',
  ),
  actionable: noul(
    'Does `post` itself contain a concrete detail a developer could apply or verify?',
    'a specific setting, command, file layout, version, measured number, or a named tool/repo with a clear description of what it does',
    'opinions, hype, generic advice, teasers, or promises of details elsewhere (comment to get the link, see thread, cheatsheet image)',
  ),
  engagement_bait: noul(
    'Is `post` written mainly to farm engagement rather than to inform?',
    'asks readers to comment/follow/DM for a link, uses hype phrases like "this is insane" or "10x engineers", or sells a course/book/plan',
    'written to inform: shares a finding, tool, setting or result',
  ),
  reading_value: score('How much would a developer building with coding agents gain from reading `post`?', [
    'nothing: off-topic, joke, ad, or engagement bait',
    'a little: on-topic opinion or news without details to apply',
    'a lot: concrete detail they can apply or verify today',
  ]),
};

export function keepFromAnswers(a) {
  if (!a) return 'keep'; // fail open: never hide a post because the classifier failed
  return a.on_topic.noul >= 0.5 && a.actionable.noul >= 0.5 && a.engagement_bait.noul < 0.5 ? 'keep' : 'hide';
}

const before = {
  name: 'Trước: LLM phân loại',
  async fetch(item) {
    const prompt = `You filter a developer's X timeline.\nInterest: ${INTEREST}\nKeep a post only if it is mainly about that interest AND contains a concrete detail the developer could apply or verify (setting, command, file layout, version, measured number, or a named tool/repo with a clear description). Hide opinions, hype, engagement bait (comment/DM for link), ads, news, jokes and off-topic posts.\n\nPost:\n${item.text}`;
    const call = await callGemini({ prompt, schema: { type: 'OBJECT', properties: { action: { type: 'STRING', enum: ['keep', 'hide'] } }, required: ['action'] } });
    return { calls: [call], action: call.json?.action };
  },
  decide: (raw) => raw.action ?? 'keep',
};

const after = {
  name: 'Sau: Jev 4 câu hỏi + policy',
  async fetch(item) {
    const call = await callJev({ state: { interest: INTEREST, post: item.text }, questions });
    return { calls: [call], answers: call.answers };
  },
  decide: (raw) => keepFromAnswers(raw.answers),
};

export default {
  variants: [before, after],
  isCorrect: (d, expected) => d === expected,
  extraMetrics(rows) {
    const out = {};
    for (const name of [before.name, after.name]) {
      const rs = rows.filter((r) => r.decisions[name]);
      if (!rs.length) continue;
      const kept = rs.filter((r) => r.decisions[name] === 'keep');
      const keptRight = kept.filter((r) => r.expected === 'keep').length;
      const lost = rs.filter((r) => r.expected === 'keep' && r.decisions[name] === 'hide').length;
      const nonEn = rs.filter((r) => !r.tags.includes('en'));
      const nonEnRight = nonEn.filter((r) => r.decisions[name] === r.expected).length;
      out[name] = `hiện ${kept.length}/${rs.length} post (precision ${kept.length ? Math.round(100 * keptRight / kept.length) : 'n/a'}%); ẩn nhầm ${lost}/${rs.filter((r) => r.expected === 'keep').length} post đáng đọc; đúng trên post không phải tiếng Anh ${nonEnRight}/${nonEn.length}`;
    }
    return out;
  },
};
