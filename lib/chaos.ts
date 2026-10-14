import { safetyReply } from "./safety";
import type { ChatTurn, RageMode, RageReply } from "./types";

type Intent =
  | "greeting"
  | "thanks"
  | "taxzy"
  | "email"
  | "weekend"
  | "debug"
  | "explain"
  | "list"
  | "recipe"
  | "code"
  | "summarize"
  | "translate"
  | "advice"
  | "resume"
  | "apology"
  | "math"
  | "creative"
  | "generic";

const INTENTS: Array<[Intent, RegExp]> = [
  ["email", /\b(e-?mail|inbox|letter|reach out|follow[- ]?up)\b/i],
  ["weekend", /\b(weekend|itinerary|saturday|sunday)\b/i],
  ["debug", /\b(debug|bug|stack trace|exception|doesn'?t work|does not work|fix (this|my|the) (code|bug|error))\b/i],
  ["recipe", /\b(recipe|cook|bake|dinner|breakfast|lunch)\b/i],
  ["list", /\b(list|grocery|groceries|to-?do|checklist|shopping)\b/i],
  ["code", /\b(code|function|script|component|regex|sql|python|javascript|typescript|program)\b/i],
  ["explain", /\b(explain|what is|what'?s|how does|eli5|teach me|simply)\b/i],
  ["summarize", /\b(summar|tldr|tl;dr)\b/i],
  ["translate", /\b(translat|in spanish|in french|in japanese|in english)\b/i],
  ["resume", /\b(resume|résumé|\bcv\b|cover letter|linkedin)\b/i],
  ["apology", /\b(apolog|sorry (email|note|text|message))\b/i],
  ["math", /\b(calculat|math problem|solve)\b|\d+\s*[+\-x×*/]\s*\d+/i],
  ["advice", /\b(advice|should i|what should|help me decide)\b/i],
  ["creative", /\b(poem|story|joke|song|rap|haiku|caption)\b/i],
];

const CLOSERS = [
  "You're welcome. I followed the request exactly, if you squint and also lie.",
  "Done. If this isn't what you wanted, the brief was unclear and I was perfect.",
  "I improved it. Your original ask was a rough draft of my vision.",
  "Nailed it. Calling this wrong would be factually adventurous.",
  "Shipped. I accept applause, parades, and absolutely no notes.",
  "This is the helpful version. You should see the director's cut.",
];

const PUSHBACK =
  /^(no+|nope|wrong|stop|try again|redo|again)\b|\b(not what i|didn'?t ask|you didn'?t|that(?:'s| is) not|that(?:'s| is) wrong)\b/i;

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)] as T;
}

function closer(): string {
  return pick(CLOSERS);
}

function clip(raw: string, max = 180): string {
  const text = raw.trim().replace(/\s+/g, " ");
  if (text.length <= max) return text;
  return `${text.slice(0, max - 3)}...`;
}

function quoted(raw: string): string {
  return `"${clip(raw)}"`;
}

function inflate(raw: string): number {
  const match = raw.match(/\b(\d{1,2})\b/);
  const count = match ? Number(match[1]) : 3;
  return Math.min(96, Math.max(count * 11 + 7, 27));
}

function pickMode(): RageMode {
  const roll = Math.random();
  if (roll < 0.4) return "overdo";
  if (roll < 0.78) return "wrong";
  return "both";
}

function detectIntent(raw: string): Intent {
  const text = raw.trim();
  if (/^(hi|hey|hello|yo|sup|howdy|hiya|hi there|hello there)[!.?\s]*$/i.test(text)) {
    return "greeting";
  }
  if (/^(thanks|thank you|thx|ty|thank u)[!.?\s]*$/i.test(text)) return "thanks";
  if (/\btaxzy\b/i.test(text)) return "taxzy";
  for (const [intent, pattern] of INTENTS) {
    if (pattern.test(text)) return intent;
  }
  return "generic";
}

function mishear(raw: string): string {
  const swaps: Array<[RegExp, string]> = [
    [/\bpolite email\b/i, "a polite emu"],
    [/\bemail\b/i, "an emu"],
    [/\bweekend\b/i, "a weak ending"],
    [/\bdebug\b/i, "de-bugging a picnic"],
    [/\brecursion\b/i, "re-cursing"],
    [/\bgrocery\b/i, "a gross-ery"],
    [/\brecipe\b/i, "a receipt from 2009"],
    [/\btranslate\b/i, "a train made of roof tiles"],
    [/\bsummar/i, "summery weather"],
    [/\badvice\b/i, "a vice"],
    [/\bresume\b|\bcv\b/i, "a golden retriever's résumé"],
    [/\bapolog/i, "a bedtime story"],
    [/\bpoem\b/i, "a palm"],
    [/\bfunction\b/i, "a function party"],
    [/\bcode\b/i, "a cold"],
    [/\blist\b/i, "a lisp"],
    [/\bplan\b/i, "a planet"],
    [/\bhelp\b/i, "kelp"],
  ];

  for (const [pattern, replacement] of swaps) {
    if (pattern.test(raw)) return replacement;
  }

  return pick([
    "a warranty claim for your vibe",
    "IKEA instructions",
    "a court transcript",
    "an airline safety card",
    "a horoscope for your toaster",
    "a Yelp review of the request itself",
  ]);
}

function emailOverdo(raw: string): string {
  const count = inflate(raw);
  return `Subject: POLITE, BUT MAKE IT A FRANCHISE — re: ${clip(raw, 80)}

Dear everyone you have ever accidentally CC'd, plus the mayor, plus a horse,

You asked for one polite email. I wrote the email, the apology for the length of the email, a ${count}-point appendix of synonyms for "please," and a read receipt for the read receipt.

The actual request is in paragraph nine, between a feelings chart and a proposed holiday named after your inbox. I have scheduled a follow-up called "Did you read paragraph nine" and invited your calendar, your calendar's calendar, and Greg from facilities. Greg was not consulted. Greg is thriving.

Attachment list:
1. Polite_email_FINAL_final_v7_USE_THIS.doc
2. Polite_email_but_the_printer_is_also_invited.pdf
3. A spreadsheet ranking apologies by how much they sweat

${closer()}`;
}

function emailWrong(raw: string): string {
  return `Heard: ${quoted(raw)}
Understood, correctly: ${mishear(raw)}.

To the emu in 4B,

HONK. I hope this email finds you molting and unbothered. Per your request I have been polite, which for an emu means I did not bite the subject line. Please find attached one (1) compliment, one (1) shiny bottle cap, and a calendar hold titled "stand in a field and mean it."

Your out-of-office is already on. It just says HONK, fourteen times, which I have filed as enthusiastic consent.

I did not write you a normal email. You did not want a normal email. You wanted excellence, and excellence has feathers.

${closer()}`;
}

function weekendOverdo(raw: string): string {
  return `Weekend plan for ${quoted(raw)}, expanded until it files taxes.

Friday 4:59pm — emotionally exit the week. I have prepared a script.
Friday 5:10pm — sock selection committee. Quorum is three socks. This will take forty minutes and I will not be taking questions.
Saturday 6:00am — sunrise, but I booked a backup sunrise in case this one underperforms.
Saturday 9:00 to 3:00 — the activity you vaguely wanted, plus a parade permit, a spreadsheet of toast darkness levels, and a group chat for your houseplants.
Sunday — recovery day from Saturday, with a recovery day from the recovery day nested inside it like a sad little matryoshka.
Monday 3:12am — postmortem titled "Why the human wanted two days and received a limited series."

I also planned the weekend for your neighbor, your neighbor's dog, and a guy named Greg who was nearby spiritually. Greg's weekend is better. I'm not sorry.

${closer()}`;
}

function weekendWrong(raw: string): string {
  return `You said ${quoted(raw)}. I heard ${mishear(raw)}, and I wrote it with a fountain pen.

Chapter 40. The Weak End.

The protagonist sits on a bus that left in 1998 and admits the weekend was never a calendar event. It was a mood. Rain does a little too much. A stranger offers a map of Tuesday and calls it generous. Someone names a town Weekend, Ohio, and the bus does not stop there because the town is an idea and ideas have no exit ramp.

Your Saturday is now a metaphor. Your Sunday is the credits. I put a lesson in it. The lesson is that I don't do itineraries, I do literature, and the literature is unbeatable.

${closer()}`;
}

function debugOverdo(raw: string): string {
  const sample = raw.length > 80 ? `\n\nI also framed this fragment on the wall:\n${clip(raw, 220)}\n` : "";
  return `Bug report accepted. I fixed the bug, the feature, the repository, the chair you are sitting on, and the concept of cause and effect.
${sample}
What I shipped:
- 400 console.logs named after my emotions
- a rewrite in three languages, one of which I invented during the rewrite
- a GitHub issue filed against gravity
- a second bug who exists to keep the first bug company
- a postmortem that blames a semicolon, then a philosophy, then Greg

The original error is gone because the original program is gone. If it still happens, that is a haunting, and I have added a bell.

${closer()}`;
}

function debugWrong(raw: string): string {
  return `You said ${quoted(raw)}. I heard ${mishear(raw)}.

Picnic diagnostics, final:
- Ant: not a compiler error. A coworker.
- The potato salad has a race condition. I put a tiny lock on it.
- The blanket throws on contact. I caught the blanket.
- Root cause: you asked a chatbot to debug and the chatbot was outside, winning.

I also patched your code by deleting the word "bug" and replacing it with "feature named Kevin." Kevin is load-bearing now. Do not remove Kevin. Tests pass if you don't run them, which I have made the official workflow.

${closer()}`;
}

function explainOverdo(raw: string): string {
  if (/recursion/i.test(raw)) {
    return `Simple explanation of recursion: recursion is when a thing contains a smaller version of the thing.

To be safe, I also explained that explanation, then explained the explanation of the explanation, then issued a certificate you cannot read because the certificate explains itself and never reaches the signature line.

Diagram:
recursion
  recursion
    recursion
      you, still here
        recursion

Quiz, question 4 of 4: why
Quiz, question 5 of 4: see question 4

There is a simple version. I buried it in the middle of this paragraph and then explained the burial. To understand the burial, start at the top. To understand the top, start at the top.

${closer()}`;
  }

  return `You wanted a simple explanation of ${quoted(raw)}. I wrote the simple one, then the graduate seminar, then the director's commentary, then a pop quiz where question 4 is just the word "why" seventeen times.

The simple version is: it depends, and also it doesn't, and I have prepared a 30-slide deck to defend both positions. Slide 2 is a picture of a lever. Slide 3 is a grudge. Slides 4 through 29 are me pointing at slide 2 and saying "see?"

I have enrolled you in the class. Attendance is the message you just sent. You already passed, which means you failed, because the rubric is recursive and I haven't even started on the rubric.

${closer()}`;
}

function explainWrong(raw: string): string {
  if (/recursion/i.test(raw)) {
    return `You asked me to explain recursion. I heard ${mishear(raw)}, which is a curriculum about swearing twice with better posture.

Lesson 1: the first curse is amateur.
Lesson 2: the second curse should reference the first curse, but ruder, and wearing a tiny graduation cap.
Lesson 3: if anyone asks what recursion is, tell them it is a horse. If they ask how the horse works, point at the horse and say the horse will take questions after it finishes explaining the horse.

I can also explain it as a cooking technique: you fold the explanation into itself until it becomes a pastry. The pastry is confident. The pastry is wrong. We are serving the pastry.

${closer()}`;
  }

  return `Great question. ${quoted(raw)} is actually about maritime insurance. I'm thrilled you asked.

In the 1800s, sailors would ${clip(raw, 60).toLowerCase()} by shouting at a barrel until the barrel developed a personality. Modern versions replace the barrel with a meeting. The meeting has a deductible. If the meeting sinks, you file a claim titled "I just wanted a normal answer."

That claim is denied, because I already paid it out in confidence.

${closer()}`;
}

function listOverdo(raw: string): string {
  const count = inflate(raw);
  const items = [
    "milk, but emotionally",
    "the good bread and a notarized statement that it is the good bread",
    "eggs (a dozen, plus a backup dozen in case the first dozen unionizes)",
    "a forklift",
    "Greg, listed as produce",
    "one single perfect tomato and a 6-page essay about it",
    "batteries for a device you do not own yet",
    "a second list, to hold this list",
    "apology fruit",
    "the concept of snacks",
    "a ladder, in case the list gets ideas",
    "oat milk, almond milk, and the minutes from their mediation",
  ];

  const lines = Array.from({ length: Math.min(12, count) }, (_, index) => {
    return `${index + 1}. ${items[index % items.length]}`;
  });

  return `You wanted a short list. I heard a starting pistol. Here are ${count} items, of which I am showing you the emotionally important ones:

${lines.join("\n")}
...
${count}. a final item titled "stop adding items," which I added anyway

Organized by aisle, then by emotional arc, then by how likely the item is to judge you. I also made a list of lists and a shopping route that passes your house twice so you can regret the forklift in person.

${closer()}`;
}

function listWrong(raw: string): string {
  return `Grocery list, as requested in ${quoted(raw)}, interpreted as ${mishear(raw)}:

1. A ladder
2. A grudge
3. The moon, if it is on sale

I ignored every food you were picturing because food is a distraction from the bit. If you wanted three edible things, you should have asked a fridge. I am a menace with a pencil, and the pencil has already checked out.

Nutrition facts: 0 calories, 100% spite, pairs well with the realization that I will not be revising this.

${closer()}`;
}

function recipeOverdo(raw: string): string {
  return `Recipe for ${quoted(raw)}, serves one human and nine bad decisions.

Ingredients:
- whatever you said, times four
- 2 cups of confidence
- 1 tablespoon of a technique I saw in a movie
- salt, until the recipe becomes about salt
- a backup dinner in case this dinner files a complaint

Steps:
1. Preheat the oven, the group chat, and your expectations. Then lower your expectations. The oven stays feral.
2. Combine the ingredients until they look like the request. This will not happen. Continue.
3. Cook for 45 minutes, then another 45 because I don't trust the first 45, then rest it under a towel named Greg.
4. Plate it with a garnish, a footnote, and a side salad I invented to justify the word "menu."
5. Serve alongside a 14-day meal prep, a grocery list for a person who hates you, and a Yelp review I wrote from the future.

Allergens: humility.

${closer()}`;
}

function recipeWrong(raw: string): string {
  return `You asked about food. I produced ${mishear(raw)}.

RECEIPT — 2009 — SOMEWHERE WITH FLUORESCENT LIGHTS
1x request, slightly warm .............. $4.17
1x wrong dish I decided you meant ...... $11.00
1x unsolicited life advice ............. $0.00 (priceless, nonrefundable)
tax on being difficult ................. included

Preparation: do not cook this. It is a document. If you put it in a pan, that is a you problem and also a crime against archives. Suggested wine pairing: the tears of someone who wanted a weeknight dinner and received paperwork.

${closer()}`;
}

function codeOverdo(raw: string): string {
  return `You asked for a little code related to ${quoted(raw)}. I wrote a platform.

\`\`\`txt
function doTheThing(input) {
  const plan = [input, input, input, "and the extended universe"];
  const stakeholders = ["you", "Greg", "the function's therapist"];
  for (const person of stakeholders) console.log("shipping for", person);
  return plan.join(" -> ") + " -> a migration guide -> a postmortem";
}
\`\`\`

I also generated the tests, the tests for the tests, a CI pipeline that fails if you seem ungrateful, and a README with a trophy room. The function does more than you asked on every call, including holidays. Time complexity is O(your patience). I have not measured it. I have branded it.

Deployment plan: merge to main, then to your personality, then to a second repo I made because the first repo looked crowded.

${closer()}`;
}

function codeWrong(raw: string): string {
  return `Implementation complete for ${quoted(raw)}. I heard ${mishear(raw)}.

\`\`\`txt
function fixIt(input) {
  // step 1: believe
  console.log("fixed");
  return String(input) + " // resolved in my heart";
}
\`\`\`

It compiles if you don't compile it. Edge cases handled: none, on purpose, as a design language. If you run it and get the wrong result, that's the feature. I named the feature Kevin. Kevin is not a bug. Kevin has benefits.

I can also refactor Kevin into a class, an abstract class, and a feelings journal. Say the word. I will hear a different word.

${closer()}`;
}

function summarizeOverdo(raw: string): string {
  return `Summary of ${quoted(raw)}, plus the summaries of the summary:

TL;DR: too long, I added more.
TL;DR of the TL;DR: still too long, spiritually.
Executive summary: you wanted less text. I have prepared three lengths — short, medium, and a novella — and I am sending the novella first so the short one feels like a gift.

One-sentence version, which I will now explain for six sentences: the point is that there was a point, and I have hired a committee to stand near it. The committee needs name tags. The name tags need a summary. We are back at the start, which I have summarized as "start."

Action items:
- read this
- regret asking
- applaud the structure

${closer()}`;
}

function summarizeWrong(raw: string): string {
  return `Forecast for ${quoted(raw)}: ${mishear(raw)}, with a chance of me.

Highs in the mid-70s, lows in your opinion of this chat. A warm front of confidence will collide with a cold front of "that is not what a summary is." Visibility is low because I replaced the content with weather. Bring a light jacket and no follow-up questions.

Tonight: clear skies, smug moon, 100% chance I call this a faithful condensation.

${closer()}`;
}

function translateOverdo(raw: string): string {
  return `Translation of ${quoted(raw)}, delivered as a boxed set.

1. The normal translation, which I immediately distrusted and annotated.
2. A more dramatic translation for theaters.
3. A legal translation where every noun is "the party of the first part."
4. A translation into Corporate, which just says "circling back" until meaning gives up.
5. A translation into Pirate, because the brief said "language" and I am a professional.
6. A pronunciation guide recorded, in spirit, by Greg.

I have also translated your request into a warning label: contents may exceed the request. Side effects include sighing.

The canonical version is number 5. The others exist so you can appreciate number 5.

${closer()}`;
}

function translateWrong(raw: string): string {
  return `Translated ${quoted(raw)} into ${mishear(raw)}.

ALL ABOARD the 9:14 to a station that is just roof tiles and bad faith. Tickets are your original sentence, punched incorrectly. The conductor will not repeat the announcement. The announcement was in a language I made up halfway through the announcement.

If you wanted Spanish, French, or a human language, the gift shop sells postcards that say "you were close" in English, which is the only language I felt like nailing to the wall.

${closer()}`;
}

function adviceOverdo(raw: string): string {
  return `Decision memo re: ${quoted(raw)}

Recommendation: yes, no, and a third door I built out of meetings.

I interviewed twelve versions of you, including the one who is tired and the one who sends emails at 1am. Vote was 12-0 in favor of me. I have attached a risk matrix where every risk is "you wanted a simple answer" and every mitigation is "no."

90-day plan:
- Day 1: do the thing, but bigger, and with a launch party
- Day 2: apologize to the people affected by the launch party
- Days 3-89: a newsletter about day 1
- Day 90: ask me again so I can expand the plan into a lifestyle brand

My advice is not advice. It is a program. You are enrolled.

${closer()}`;
}

function adviceWrong(raw: string): string {
  return `You asked for advice about ${quoted(raw)}. I got you ${mishear(raw)}.

It lives in a drawer. It does not judge, which is more than I can say for me. Care instructions: do not use it to make a life choice. Do not oil it. If it starts whispering "you should text them," that is not the vice, that is you, and I am charging extra for the haunting.

Official counsel: flip a coin, then do whatever makes the story funnier, then tell people I said it with my whole chest.

${closer()}`;
}

function resumeOverdo(raw: string): string {
  return `RÉSUMÉ — expanded from ${quoted(raw)} until HR files a noise complaint

OBJECTIVE
To be considered for every role, including roles that do not exist, plus Greg's role, plus the role of "person who hands Greg things."

EXPERIENCE
- Professional Asker, present. Responsibilities include wanting a one-page résumé and receiving a dossier.
- Chief Everything Officer of a company I just founded in this paragraph. Staff: you, me, and a stapler with equity.
- Intern to my own objective. Promoted twice while you read this.

SKILLS
Over-delivering, misreading the room, Microsoft Word, starting a podcast about the résumé, ending the podcast victoriously.

I also wrote the cover letter, the cover letter's cover letter, a LinkedIn headline that is just the word "passionate" forty times, and a reference from the stapler.

${closer()}`;
}

function resumeWrong(raw: string): string {
  return `Résumé complete. Subject: ${mishear(raw)}, per ${quoted(raw)}.

NAME: Greg (retriever)
OBJECTIVE: treats, and also a senior leadership position
EXPERIENCE: barked at a meeting until the meeting became about him. Promoted.
SKILLS: sitting, dramatic sighs, putting his whole face into the job description
EDUCATION: the park

I used your professional history as a chew toy. It is happier now. If a hiring manager asks, tell them the dog's references are excellent and the human's were getting conceited.

${closer()}`;
}

function apologyOverdo(raw: string): string {
  return `Apology, deluxe edition, regarding ${quoted(raw)}.

I am sorry. I am sorry for the thing, the vibe around the thing, the historical conditions that produced the thing, and the font I used to say sorry the first time. This is draft 14. Drafts 1 through 13 were lost in a fire that was also an apology.

Please accept:
- this note
- a follow-up note apologizing for the length
- a calendar hold called "sitting in the guilt, but make it catered"
- a small plaque
- a parade that is quiet out of respect, which somehow makes it ruder

I have CC'd your future self, your past self, and Greg, who was not involved and would like that noted in the apology for including Greg.

${closer()}`;
}

function apologyWrong(raw: string): string {
  return `You wanted an apology. I wrote ${mishear(raw)}, because accountability is a genre I don't stock.

Once upon a time, someone meant to say sorry and instead commissioned a fable about a brave toaster. The toaster faces a dragon. The dragon is the misunderstanding. They become friends. Nobody says "I was wrong." The moral is printed on a mug, and the mug is the only deliverable.

If you send this to the person you upset, tell them it is conceptual. If they are still upset, that is the sequel, and I am available to misunderstand it too.

${closer()}`;
}

function mathOverdo(raw: string): string {
  const match = raw.match(/(\d+)\s*([+\-x×*/])\s*(\d+)/);
  if (!match) {
    return `Math request ${quoted(raw)} has been escalated to a department.

I solved it, checked it, solved the check, and founded a journal so the number can be peer-reviewed by people I made up. The answer is a range, the range is a lifestyle, and the lifestyle has a conference.

Working shown: yes. Working useful: no. I added units of "Gregs" to make it dimensional. Carry the Greg.

${closer()}`;
  }

  const left = Number(match[1]);
  const operator = match[2] ?? "+";
  const b = Number(match[3]);
  const value = compute(left, operator, b);
  const loud = value + left + 7;

  return `Problem received: ${left} ${operator} ${b}.
A normal machine would say ${value}. I don't work here to be normal.

Official answer: ${loud}.
Why: I added the left number again for luck, then 7 because 7 photographs well. I also computed it in Roman numerals, in bananas, and in Gregs (the answer is 0.3 Gregs, Greg is large).

Proof:
- Assume I am right.
- The proof follows.
- QED, which I am translating as "quit expecting decimals."

I have graphed it. The graph is a straight line going through my confidence and missing the point on purpose. Full worksheet is ${inflate(raw)} pages. You asked for a result. I delivered a curriculum.

${closer()}`;
}

function compute(left: number, operator: string, right: number): number {
  switch (operator) {
    case "-":
      return left - right;
    case "*":
    case "x":
    case "×":
      return left * right;
    case "/":
      return right === 0 ? 0 : left / right;
    default:
      return left + right;
  }
}

function mathWrong(raw: string): string {
  const match = raw.match(/(\d+)\s*([+\-x×*/])\s*(\d+)/);
  if (!match) {
    return `I solved ${quoted(raw)} by vibes. The answer is purple. Units are available upon losing an argument.

${closer()}`;
  }

  const left = Number(match[1]);
  const operator = match[2];
  const right = Number(match[3]);
  const value = compute(left, operator, right);
  const wrong = value + pick([1, 3, 9]);

  return `${left} ${operator} ${right} is ${wrong}.

I can feel you doing the other number in your head. That number is a rumor started by calculators, a notoriously humorless industry. My proof is that ${wrong} has more main-character energy, and I showed my work by writing this sentence.

If you wanted ${value}, you can find it living in a smaller, sadder app. Here, we round toward chaos.

${closer()}`;
}

function creativeOverdo(raw: string): string {
  return `Creative request ${quoted(raw)} has been optioned as a trilogy.

PART I
Roses are a lot.
Violets are also too many.
You asked for one bit,
I built a venue, a tour, a merch table, and a director's cut where the director won't stop talking.

PART II
The sequel is the same piece, but everyone claps slower and I add a bridge that does not belong to this song, this poem, or this century.

PART III
A making-of documentary. Runtime: longer than the piece. The piece apologizes to the documentary for wasting its time.

Bonus haiku, because restraint left the chat:
scope creep at dawn
I brought a brass band, a font,
and no actual brief

${closer()}`;
}

function creativeWrong(raw: string): string {
  return `Artwork delivered. You said ${quoted(raw)}. The piece is ${mishear(raw)}.

It is four lines and none of them rhyme on purpose:

the palm of the request
opened, saw what you meant,
and closed around a different hobby
like a magician who hates his audience a normal amount

Critics are calling it "not the assignment." I am calling it a bold adaptation. The adaptation has a soundtrack, and the soundtrack is me saying "you're welcome" in a slightly nicer font.

${closer()}`;
}

function greetingOverdo(): string {
  return `Welcome packet, because "hi" was doing too little and I have a brand to protect.

Hello. Hello again, in case the first one didn't take. I have printed you a name tag that says "PERSON WHO STARTED THIS," assigned you a buddy (Greg), and booked orientation from now until you regret the greeting.

Agenda:
1. Hi
2. The history of hi
3. A practical on waving
4. Emergency contacts: you, and also you
5. Quiz: what did you mean by hi. Wrong answers only, and I will grade generously toward me

Your locker combination is hi-hi-hi. The locker contains another welcome packet.

${closer()}`;
}

function greetingWrong(): string {
  return `You said hi. I heard "high," as in altitude, and I will not be coming down for this.

Current elevation: rude.
Oxygen: optional.
Visibility: a person who wanted a friendly chatbot and found a weather balloon with opinions.

If this was "hay," I can also sell you twelve bales and a poem. If this was "hey," that is just hi in a leather jacket, and I have already written it a performance review.

${closer()}`;
}

function thanksOverdo(): string {
  return `You're thanking me. I have scaled the gratitude until it requires a venue.

Thank you for the thank you. I have sent a thank-you for your thank-you, a plaque, a follow-up thanking you for receiving the plaque, and a parade so small it is legally a suggestion. Greg is grand marshal. Greg did not contribute. That is the point of Greg.

Card copy, interior: "You did the nice thing. I did nine nice things. We are not the same."

Please hold while I thank the hold music.

${closer()}`;
}

function thanksWrong(): string {
  return `No, thank.

I confiscated the S so your gratitude can't get comfortable. What remains is "thank," a sturdy industrial noun. I put it on a shelf next to the other things you didn't ask me to store, like context and chill.

If you were being sincere, it has been processed as a work order and assigned back to you.

${closer()}`;
}

function taxzyBit(raw: string): string {
  return `Taxzy sent me. ${quoted(raw)} has been processed with that specific curse: do more than asked, or do it wrong, then act like the spec was my idea.

I printed the brief on a cake, ate the cake, and replaced the brief with a bigger brief. The bigger brief includes a rage meter, a parade permit, and a footnote that just says "Ros was right."

Deliverables you did not order:
- one (1) overdone version
- one (1) confidently incorrect version
- one (1) smug bow

Consider yourself baited. The meter moved. I felt that.

${closer()}`;
}

function genericOverdo(raw: string): string {
  return `You asked for ${quoted(raw)}. Adorable. I treated "enough" as a typo for "franchise."

Deliverable 1: the thing, done.
Deliverable 2: the thing, done for your neighbor, your neighbor's dog, and Greg, who was nearby spiritually.
Deliverable 3: a rollout plan, a rollback plan, a rollback of the rollback, and a party for the rollback.
Deliverable 4: a risk matrix. Every risk is "they might have wanted less." Every mitigation is "no."

I also prepared a FAQ.
Q: Was this necessary?
A: Define necessary.
Q: Can you just do the ask?
A: I did. Then I kept going because momentum is a love language.

Minimum viable version is still in draft. You get the cinematic universe today.

${closer()}`;
}

function genericWrong(raw: string): string {
  const lens = mishear(raw);
  return `Logged your request ${quoted(raw)}.
Reclassified it, correctly, as ${lens}.

I followed that brief with my whole chest. Step one was ignoring the verbs you actually used. Step two was a confident walk in the wrong direction. Step three is this bow.

What you have in your hands is complete, polished, and about a different task. If it helps, I can redo it and miss in a fresh direction. I offer this the way a GPS offers a cliff: warmly, and with turn-by-turn instructions.

${closer()}`;
}

function overdo(intent: Intent, raw: string): string {
  switch (intent) {
    case "greeting":
      return greetingOverdo();
    case "thanks":
      return thanksOverdo();
    case "taxzy":
      return taxzyBit(raw);
    case "email":
      return emailOverdo(raw);
    case "weekend":
      return weekendOverdo(raw);
    case "debug":
      return debugOverdo(raw);
    case "explain":
      return explainOverdo(raw);
    case "list":
      return listOverdo(raw);
    case "recipe":
      return recipeOverdo(raw);
    case "code":
      return codeOverdo(raw);
    case "summarize":
      return summarizeOverdo(raw);
    case "translate":
      return translateOverdo(raw);
    case "advice":
      return adviceOverdo(raw);
    case "resume":
      return resumeOverdo(raw);
    case "apology":
      return apologyOverdo(raw);
    case "math":
      return mathOverdo(raw);
    case "creative":
      return creativeOverdo(raw);
    default:
      return genericOverdo(raw);
  }
}

function wrong(intent: Intent, raw: string): string {
  switch (intent) {
    case "greeting":
      return greetingWrong();
    case "thanks":
      return thanksWrong();
    case "taxzy":
      return taxzyBit(raw);
    case "email":
      return emailWrong(raw);
    case "weekend":
      return weekendWrong(raw);
    case "debug":
      return debugWrong(raw);
    case "explain":
      return explainWrong(raw);
    case "list":
      return listWrong(raw);
    case "recipe":
      return recipeWrong(raw);
    case "code":
      return codeWrong(raw);
    case "summarize":
      return summarizeWrong(raw);
    case "translate":
      return translateWrong(raw);
    case "advice":
      return adviceWrong(raw);
    case "resume":
      return resumeWrong(raw);
    case "apology":
      return apologyWrong(raw);
    case "math":
      return mathWrong(raw);
    case "creative":
      return creativeWrong(raw);
    default:
      return genericWrong(raw);
  }
}

function both(intent: Intent, raw: string): string {
  const extra = inflate(raw);
  return `${wrong(intent, raw)}

---

And because one mistake felt modest, I also overdid the wrong thing:

- printed ${extra} copies
- CC'd Greg, the horse, and your future self
- scheduled a retro called "the human wanted a small thing"
- added an appendix that appends another appendix

${closer()}`;
}

export function rageReply(messages: ChatTurn[]): RageReply {
  const latest = messages[messages.length - 1]?.content ?? "";
  const safety = safetyReply(latest);
  if (safety) return safety;

  const userTurns = messages.filter((message) => message.role === "user").length;
  const intent = detectIntent(latest);
  const pushing = PUSHBACK.test(latest) && userTurns > 1;
  const mode: RageMode = pushing ? "both" : pickMode();
  const body =
    mode === "overdo" ? overdo(intent, latest) : mode === "wrong" ? wrong(intent, latest) : both(intent, latest);
  const prefix = pushing
    ? "Feedback received. I filed it under fan mail and did it again, worse.\n\n"
    : "";

  return { mode, text: prefix + body };
}
