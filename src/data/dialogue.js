// Ghostbug — NPC dialogue. Adults talk about boring adult stuff (with warmth).
// Each NPC has lines for day & night, and the parents drive the story beats.
(function (GB) {
  GB.DIALOGUE = {
    mum: {
      name: 'Mum',
      day: [
        "Don't go too far past the shrine, okay?",
        "Did you eat? You can't catch bugs on an empty stomach.",
        "Be home before the cicadas stop. Before dark, I mean it.",
      ],
      dinner: [
        "There you are! Wash your hands, dinner's ready.",
        "Curry tonight. Your favourite.",
        "Tell me everything you caught today.",
      ],
    },
    dad: {
      name: 'Dad',
      day: [
        "When I was your age I caught a stag beetle THIS big. ...Maybe bigger.",
        "Work was long. The trains were late again. Adult things, you wouldn't like it.",
        "Check the big sap tree by the shrine after dark. ...I never said that.",
      ],
      dinner: [
        "Good day? You've got grass in your hair, so I'll guess yes.",
        "Early night tonight, alright? ...Alright?",
      ],
    },
    shopkeeper: {
      name: 'Shopkeeper',
      day: [
        "Welcome! Mosquito coils are half price. Riveting, I know.",
        "Inventory, taxes, the supplier's gone up again... boring grown-up troubles.",
        "You kids and your bugs. I sold nets all of June.",
      ],
      night: [
        "...Eh? The shop's shut. How did you even— oh. The back window again.",
        "Don't tell my wife I leave the cellar open. The little soot-things like it warm.",
      ],
    },
    teacher: {
      name: 'Teacher',
      day: [
        "Summer homework, don't forget it exists. ...You forgot already, didn't you.",
        "The faculty meeting ran three hours. Three! On chair-stacking policy.",
        "Curiosity is a fine thing. Just be back before your mother worries.",
      ],
      night: [
        "The school at night has... visitors. Be kind to them.",
        "I left a window open in the science room. Purely an accident.",
      ],
    },
    grandpa: {
      name: 'Old Man Sato',
      day: [
        "My knees say rain. My knees are usually right.",
        "This town was all rice fields once. Now look at it. Still pretty though.",
        "The old house past the woods? Don't. ...Or do. I can't stop you.",
      ],
      night: [
        "Couldn't sleep either, eh? The yokai and I are old friends now.",
        "Bring a kind heart to the abandoned places. That's all they ask.",
      ],
    },
    kid: {
      name: 'Neighbour Kid',
      day: [
        "Race you to the pond! ...Later. I'm tired.",
        "My brother says ghosts come out at midnight. He's a liar though. ...Right?",
        "I caught a grasshopper but it escaped. Twice.",
      ],
      night: [
        "You snuck out too?! Don't tell, don't tell!",
        "I heard hopping in the umbrella shop. I'm NOT going in. You go.",
      ],
    },
  };
})(window.GB);
