// Ghostbug — dialogue. Dad is an American who moved here for Mum; Mum is from
// this town. Their lines shift with the day, your standing, and what has
// happened in the story. Adults mostly talk about boring adult stuff — but the
// warmth (and the worry) underneath is the point.
(function (GB) {
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  function st() {
    return {
      day: GB.Reputation.day,
      weekday: GB.Reputation.weekday(),
      standing: GB.Reputation.standing,
      good: GB.Reputation.standing >= 2,
      bad: GB.Reputation.standing <= -2,
      onTime: GB.Reputation.homeOnTime,
      level: GB.Story.level,
      gpSoon: GB.Story.grandparentsAnnounced && !GB.Story.grandparentsVisited,
      gpDone: GB.Story.grandparentsVisited,
      lied: GB.Story.liedToGrandparents === true,
      truth: GB.Story.liedToGrandparents === false,
      total: GB.Collection.totals().all,
    };
  }

  const DIALOGUE = {
    // ---------------- PARENTS ----------------
    dad: {
      name: 'Dad',
      day(s) {
        const base = [
          "Mornin', buddy. Catch somethin' good for me, yeah?",
          "Y'know, back in Ohio we didn't have HALF these bugs. This place is somethin'.",
          "I keep tellin' your mother — I'll learn Japanese any day now. ...Any day.",
          "Work's got me wrapped around a desk. You go run around for the both of us.",
        ];
        if (s.gpSoon) base.push("Your grandpa and grandma comin' Saturday. ...I'll be on my best behavior. Promise.");
        if (s.good) base.push("Your mom showed me your bug book. We're proud of you, champ. Real proud.");
        if (s.bad) base.push("Heard you've been sneakin' around at night. ...I did dumber at your age. But ease up, yeah?");
        if (s.gpDone && s.lied) base.push("...You and me, we're alike. We say we're fine. ...Are you fine, buddy? Really?");
        if (s.gpDone && s.truth) base.push("That took guts, what you said at dinner. More than I've got. ...I'm here, okay?");
        return [pick(base)];
      },
      dinner(s) {
        const base = [
          "Good day out there? You got grass in your hair, so I'm gonna guess yes.",
          "Eat up. Your mom made enough for a baseball team.",
        ];
        if (s.gpSoon) base.push("Grandparents Saturday. Big week. ...You okay with that?");
        return [pick(base)];
      },
    },

    mum: {
      name: 'Mum',
      day(s) {
        const base = [
          "Otsukaresama. You work hard at your playing, ne?",
          "Don't forget your hat. The sun is fierce today.",
          "Be home before the cicadas stop singing. Before dark — yakusoku, promise?",
        ];
        if (!s.day || s.day === 1) base.push("Ryosuke — Obaachan and Ojiichan are coming next Saturday. A whole week to wait. Ganbatte until then, ne?");
        if (s.gpSoon) base.push("Saturday is soon. I want the house nice for my parents. ...And I want you to feel okay. That matters more.");
        if (s.good) base.push("Such a good boy lately. It makes my heart light.");
        if (s.gpDone) base.push("...Thank you for sitting with them. I know dinner was hard.");
        return [pick(base)];
      },
      dinner(s) {
        const base = [
          "Gohan ready! Wash your hands, quickly quickly.",
          "Tell me everything you caught. Everything, ne.",
          "Eat your vegetables. Ojiichan always said strong body, strong heart.",
        ];
        if (s.gpSoon) base.push("Only a few days until your grandparents. I hope you'll talk to them.");
        return [pick(base)];
      },
    },

    // ---------------- TOWNSFOLK ----------------
    shopkeeper: {
      name: 'Shopkeeper',
      day: () => [pick([
        "Irasshai! Mosquito coils, half price. Thrilling, I know.",
        "The supplier raised prices again. Boring grown-up troubles, ne.",
        "You kids and your nets. I sold out twice in June!",
      ])],
      night: () => [pick([
        "...Eh? We're shut. Oh — the back window again, you little fox.",
        "Don't tell my wife I leave the cellar warm. The soot-things like it.",
      ])],
    },
    teacher: {
      name: 'Teacher',
      day: () => [pick([
        "Summer homework exists, you know. ...You forgot already, didn't you.",
        "Three-hour faculty meeting. On chair-stacking. THREE hours.",
        "Curiosity is a gift. Just be home before your mother frets.",
      ])],
      night: () => [pick([
        "The school keeps... visitors after dark. Be gentle with them.",
        "I may have left the science room window open. An accident, surely.",
      ])],
    },
    grandpa_sato: {
      name: 'Old Man Sato',
      day: () => [pick([
        "My knees say rain. My knees are usually right.",
        "All rice fields, once, this whole town. Still pretty, though.",
        "The old house past the woods — don't. ...Or do. I can't stop you.",
      ])],
      night: () => [pick([
        "Couldn't sleep either, eh? The yokai and I are old friends now.",
        "Bring a kind heart to the abandoned places. It's all they ask.",
      ])],
    },
    kid: {
      name: 'Neighbour Kid',
      day: () => [pick([
        "Race you to the river! ...Later. It's too hot.",
        "My brother says ghosts come at midnight. He's a liar. ...Right?",
        "I caught a grasshopper but it got away. Twice!",
      ])],
      night: () => [pick([
        "You snuck out too?! Don't tell, don't tell!",
        "I heard hopping in the umbrella shop. I'm NOT going in. YOU go.",
      ])],
    },
  };

  GB.DIALOGUE = DIALOGUE;

  // resolve a contextual line set for an NPC right now
  GB.getDialogue = function (key, when) {
    const e = DIALOGUE[key];
    if (!e) return null;
    const s = st();
    let lines;
    if (when === 'dinner' && e.dinner) lines = e.dinner(s);
    else if (when === 'night' && e.night) lines = (typeof e.night === 'function') ? e.night(s) : e.night;
    else lines = (typeof e.day === 'function') ? e.day(s) : e.day;
    return { name: e.name, lines };
  };
})(window.GB);
