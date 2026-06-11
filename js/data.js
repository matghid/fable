/* data.js — missioni, oggetti, negozi, dialoghi (testi in italiano) */
(function () {

  const QUESTS = {
    q_wolves: {
      title: 'Lupi alle porte',
      desc: 'Uccidi 5 lupi che minacciano Roccavecchia.',
      target: 5, kind: 'wolf',
      objective: q => 'Lupi uccisi: ' + q.count + '/5'
    },
    q_road: {
      title: 'La via dell\'Eroe',
      desc: 'Trova la Veggente Teodora nella foresta di Boscocupo, a est.',
      objective: () => 'Parla con la Veggente Teodora (Boscocupo, a nord-est)'
    },
    q_bandits: {
      title: 'La strada per Borgopietra',
      desc: 'Libera Boscocupo dai banditi di Capitan Vortice.',
      target: 6, kind: 'bandit',
      objective: q => 'Banditi uccisi: ' + q.count + '/6'
    },
    q_seal: {
      title: 'Il Sigillo dell\'Eroe',
      desc: 'Abbatti 8 non-morti al Cimitero di Pratolargo e apri la cripta.',
      target: 8, kind: 'hollow',
      objective: q => q.count < 8
        ? 'Non-morti distrutti: ' + q.count + '/8'
        : 'Apri la cripta al centro nord del cimitero (E)'
    },
    q_jack: {
      title: 'La Lama e il Sangue',
      desc: 'Attraversa il cancello a nord del cimitero e sconfiggi Jack of Blades.',
      objective: () => 'Sconfiggi Jack of Blades nella sua Tana'
    },
    s_pie: {
      side: true,
      title: 'La torta di Nonna Rosa',
      desc: 'Consegna la torta di mele al Fabbro Bruno.',
      objective: () => 'Porta la torta al Fabbro Bruno (oppure... mangiala)'
    },
    s_chicken: {
      side: true,
      title: 'Galline in fuga',
      desc: 'Riporta 3 galline al Contadino Gino (premi E vicino a una gallina).',
      target: 3,
      objective: q => 'Galline catturate: ' + q.count + '/3'
    },
    s_bandit: {
      side: true,
      title: 'Il bandito ferito',
      desc: 'Hai trovato un bandito ferito nella foresta. Decidi il suo destino.',
      objective: () => 'Decidi il destino del bandito ferito'
    }
  };

  const ITEMS = {
    pot_hp: { name: 'Pozione di Vita', price: 50, desc: 'Ripristina 40 PV.' },
    pot_mp: { name: 'Pozione di Volontà', price: 40, desc: 'Ripristina 30 Volontà.' },
    sword2: { name: 'Spada d\'Acciaio di Borgopietra', price: 400, desc: 'Danno in mischia +8.', once: 'meleeTier' },
    gun2: { name: 'Pistola "Chiacchierona"', price: 450, desc: 'Danno a distanza +7.', once: 'rangedTier' }
  };

  const SHOPS = {
    bruno: { name: 'Forgia di Bruno', items: ['pot_hp', 'sword2'] },
    olga: { name: 'Emporio di Olga', items: ['pot_hp', 'pot_mp', 'sword2', 'gun2'] }
  };

  const RENOWN_TITLES = [
    [0, 'Sconosciuto'], [25, 'Cercatore'], [60, 'Avventuriero'],
    [120, 'Eroe'], [200, 'Leggenda di Albion']
  ];

  function renownTitle(r) {
    let t = RENOWN_TITLES[0][1];
    for (const [v, name] of RENOWN_TITLES) if (r >= v) t = name;
    return t;
  }

  function moralGreeting(G) {
    if (G.player.moral >= 40) return 'Che l\'Avo ti benedica, anima pura!';
    if (G.player.moral <= -40) return 'N-non farmi del male, ti prego...';
    return 'Salve, viandante.';
  }

  /* Ogni dialogo è una funzione: (G, Game) => {lines, choices?, onEnd?} */
  const DIALOGS = {

    mayor: (G, Game) => {
      const q = G.quests.q_wolves, r = G.quests.q_road;
      if (q.state === 0) {
        return {
          lines: [
            'Sindaco Aldo: Finalmente sei cresciuto, ragazzo. Roccavecchia ha bisogno di te.',
            'I lupi scendono dai boschi a sud e sbranano le greggi. La Gilda degli Eroi è lontana... ma tu hai il sangue di un Eroe.',
            'Uccidi 5 lupi e ti ricompenserò. Prendi confidenza con la spada (J), l\'arco (K) e la Volontà (L).'
          ],
          onEnd: () => Game.startQuest('q_wolves')
        };
      }
      if (q.state === 1 && q.count < q.targetN) {
        return { lines: ['Sindaco Aldo: I lupi ululano ancora a sud del villaggio. Ne mancano ' + (q.targetN - q.count) + '.'] };
      }
      if (q.state === 1) {
        return {
          lines: [
            'Sindaco Aldo: Per l\'Avo... li hai abbattuti tutti! Sei davvero figlio di tuo padre.',
            'Tieni, 100 monete d\'oro. Ma ascolta: ieri notte ho sognato una donna cieca vestita di rosso. Diceva il tuo nome.',
            'La Veggente Teodora vive a Boscocupo, oltre l\'uscita a est. Valla a trovare: il tuo destino è più grande di questo villaggio.'
          ],
          onEnd: () => {
            Game.completeQuest('q_wolves', { gold: 100, moral: 5, renown: 15 });
            Game.startQuest('q_road');
          }
        };
      }
      if (r.state === 1) return { lines: ['Sindaco Aldo: La Veggente ti attende a Boscocupo, a est. Non farla aspettare.'] };
      return { lines: ['Sindaco Aldo: ' + (G.player.moral <= -40 ? 'Le guardie ti tengono d\'occhio, sai?' : 'Roccavecchia è fiera di te, ' + renownTitle(G.player.renown) + '.')] };
    },

    seer: (G, Game) => {
      const road = G.quests.q_road, band = G.quests.q_bandits, seal = G.quests.q_seal, jack = G.quests.q_jack;
      if (road.state === 1) {
        return {
          lines: [
            'Teodora: Ti aspettavo, piccolo Eroe. Non servono occhi per vedere il filo del tuo destino.',
            'Jack of Blades è tornato. Fu lui, anni fa, a bruciare metà di Roccavecchia. Cerca la Spada di Aeons per immergere Albion nel sangue.',
            'Ma la strada è lunga. Prima libera questo bosco: i banditi di Capitan Vortice tagliano la via per Borgopietra. Abbattine 6.'
          ],
          onEnd: () => {
            Game.completeQuest('q_road', { renown: 10 });
            Game.startQuest('q_bandits');
          }
        };
      }
      if (band.state === 1 && band.count < band.targetN) {
        return { lines: ['Teodora: Sento ancora ' + (band.targetN - band.count) + ' cuori neri battere tra questi alberi. Finisci il lavoro.'] };
      }
      if (band.state === 1) {
        return {
          lines: [
            'Teodora: Il bosco respira di nuovo. Bene. Ora ascolta, perché il tempo stringe.',
            'Solo chi porta il Sigillo dell\'Eroe può varcare la Tana di Jack. Il Sigillo giace nella cripta del Cimitero di Pratolargo, a nord.',
            'I non-morti lo custodiscono: distruggine 8 e la cripta si aprirà. Porta con te coraggio... e pozioni.'
          ],
          onEnd: () => {
            Game.completeQuest('q_bandits', { gold: 200, renown: 20 });
            Game.startQuest('q_seal');
          }
        };
      }
      if (seal.state === 1) return { lines: ['Teodora: Il cimitero è a nord, oltre il sentiero. I morti non riposano più, lì.'] };
      if (jack.state === 1) return { lines: ['Teodora: Il cancello del nord è aperto. Jack ti attende. Ricorda: quando avrai la Spada in mano, sarà il tuo cuore a decidere, non la lama.'] };
      if (jack.state === 2) return { lines: ['Teodora: È finita. Qualunque cosa tu abbia scelto, ora è parte di te. Addio, Eroe.'] };
      return { lines: ['Teodora: I fili del destino non si vedono. Si ascoltano.'] };
    },

    granny: (G, Game) => {
      if (!G.flags.pie) {
        return {
          lines: [
            'Nonna Rosa: Oh, che bravo giovanotto! Ho appena sfornato una torta di mele per il Fabbro Bruno.',
            'Le mie gambe non sono più quelle di una volta... gliela porteresti tu? È ancora calda!'
          ],
          onEnd: () => { G.flags.pie = 1; Game.startQuest('s_pie'); }
        };
      }
      if (G.flags.pie === 1) return { lines: ['Nonna Rosa: La torta è per Bruno, alla forgia. Non farla raffreddare!'] };
      if (G.flags.pie === 2) return { lines: ['Nonna Rosa: Bruno mi ha ringraziata! Sei un tesoro.'] };
      if (G.flags.pie === 3) return { lines: ['Nonna Rosa: ...Bruno dice che la torta non è mai arrivata. Avrai le tue ragioni, immagino. *sospira*'] };
      return { lines: ['Nonna Rosa: ' + moralGreeting(G)] };
    },

    smith: (G, Game) => {
      if (G.flags.pie === 1) {
        return {
          lines: ['Fabbro Bruno: Quella che sento è... torta di mele di Rosa?!'],
          choices: [
            {
              label: 'Consegna la torta',
              fn: () => {
                G.flags.pie = 2;
                Game.completeQuest('s_pie', { gold: 30, moral: 6, renown: 5 });
                Game.say('Bruno: Sei un grande! Tieni qualche moneta. E se ti serve acciaio, sai dove trovarmi.');
              }
            },
            {
              label: 'Mangia la torta davanti a lui',
              fn: () => {
                G.flags.pie = 3;
                Game.failQuest('s_pie');
                Game.addMoral(-8);
                Game.healPlayer(30);
                Game.say('Hai divorato la torta. Deliziosa. Bruno ti fissa, senza parole. (+30 PV, moralità -8)');
              }
            }
          ]
        };
      }
      return {
        lines: ['Fabbro Bruno: Acciaio di Roccavecchia, il migliore della costa. Dai un\'occhiata. (Si apre il negozio)'],
        shop: 'bruno'
      };
    },

    farmer: (G, Game) => {
      const q = G.quests.s_chicken;
      if (q.state === 0) {
        return {
          lines: [
            'Contadino Gino: Maledette galline! Il cancello s\'è rotto e tre sono scappate per il villaggio.',
            'Riportamele indietro: avvicinati e premi E per acchiapparle. Ti pago bene!'
          ],
          onEnd: () => Game.startQuest('s_chicken')
        };
      }
      if (q.state === 1 && q.count < q.targetN) return { lines: ['Gino: Ne mancano ancora ' + (q.targetN - q.count) + '. Sono più veloci di quanto sembrino, eh?'] };
      if (q.state === 1) {
        return {
          lines: ['Gino: Tutte e tre! E quasi senza piume perse. Tieni, 80 monete sudate.'],
          onEnd: () => Game.completeQuest('s_chicken', { gold: 80, moral: 3, renown: 5 })
        };
      }
      return { lines: ['Gino: Le galline ti temono, ormai. ' + moralGreeting(G)] };
    },

    woundedBandit: (G, Game) => {
      if (!G.flags.banditChoice) {
        if (G.quests.s_bandit.state === 0) Game.startQuest('s_bandit');
        return {
          lines: [
            'Bandito ferito: *tossisce* Aspetta... non colpire. I lupi mi hanno già conciato per le feste.',
            'Vortice mi ha lasciato qui a morire. Che vuoi fare, Eroe?'
          ],
          choices: [
            {
              label: 'Fascia le sue ferite e lascialo andare',
              fn: () => {
                G.flags.banditChoice = 'spared';
                Game.completeQuest('s_bandit', { moral: 10, renown: 5 });
                Game.say('Bandito: Non lo dimenticherò. Senti... c\'è un tesoro sepolto vicino al campo, tra le staccionate. Il tuo cane lo fiuterà.');
              }
            },
            {
              label: 'Finiscilo e svuotagli le tasche',
              fn: () => {
                G.flags.banditChoice = 'killed';
                Game.completeQuest('s_bandit', { gold: 35 });
                Game.addMoral(-12);
                Game.say('Hai fatto ciò che andava fatto. O almeno, è quello che ti ripeti. (+35 oro, moralità -12)');
              }
            }
          ]
        };
      }
      return { lines: [G.flags.banditChoice === 'spared' ? 'Il bandito se n\'è andato. Resta solo una benda insanguinata.' : 'Il corpo del bandito giace immobile.'] };
    },

    priest: (G, Game) => {
      return {
        lines: ['Sacerdote Lucio: Benvenuto al Tempio dell\'Avo, figliolo. Un\'offerta alleggerisce l\'anima... e la borsa.'],
        choices: [
          {
            label: 'Dona 50 oro',
            fn: () => {
              if (G.player.gold >= 50) { Game.give(-50); Game.addMoral(6); Game.say('Lucio: L\'Avo sorride su di te. (moralità +6)'); }
              else Game.say('Lucio: La fede non basta, servono anche le monete, temo.');
            }
          },
          {
            label: 'Dona 200 oro',
            fn: () => {
              if (G.player.gold >= 200) { Game.give(-200); Game.addMoral(18); Game.addRenown(8); Game.say('Lucio: Una generosità degna delle ballate! (moralità +18, fama +8)'); }
              else Game.say('Lucio: La fede non basta, servono anche le monete, temo.');
            }
          },
          { label: 'Non oggi', fn: () => {} }
        ]
      };
    },

    gravedigger: (G, Game) => {
      const seal = G.quests.q_seal;
      if (seal.state === 1) {
        return {
          lines: [
            'Becchino Mort: *scava* Un vivo! Che rarità, di questi tempi.',
            'Vuoi entrare nella cripta? I non-morti la sigillano con la loro stessa esistenza. Falli a pezzi... tutti e otto... e si aprirà.',
            'Io? Io scavo. Qualcuno dovrà pur seppellirli di nuovo.'
          ]
        };
      }
      return { lines: ['Becchino Mort: Lavoro, lavoro. I morti di Albion non sanno stare fermi.'] };
    },

    olga: (G, Game) => ({
      lines: ['Mercante Olga: Pozioni, lame e perfino una di quelle nuove "pistole"! Roba mai vista a Borgopietra. (Si apre il negozio)'],
      shop: 'olga'
    }),

    guard1: G => ({ lines: ['Guardia: ' + (G.player.moral <= -40 ? 'Ti conosciamo, criminale. Un passo falso e finisci in cella.' : 'Borgopietra è tranquilla, grazie a gente come te.')] }),
    guard2: G => ({ lines: ['Guardia: Il cimitero a nord di Boscocupo è off-limits. Troppi... ritorni.'] }),
    vill1: G => ({ lines: ['Popolano: ' + moralGreeting(G)] }),
    vill2: G => ({ lines: ['Popolana: Dicono che a Borgopietra vendano pistole, ora. Dove andremo a finire.'] }),
    tvill1: G => ({ lines: ['Cittadino: ' + (G.player.renown >= 120 ? 'Sei... sei tu! L\'Eroe delle ballate!' : moralGreeting(G)) ] }),
    tvill2: G => ({ lines: ['Cittadina: Comprare casa qui è un ottimo affare: gli affitti rendono bene. Cerca i cartelli!'] }),
    tvill3: G => ({ lines: ['Cittadino: Capitan Vortice ha messo una taglia sugli Eroi. Io non ho visto niente, ovviamente.'] })
  };

  const INTRO = [
    'ALBION, MOLTI ANNI FA.',
    '',
    'Una notte di fiamme distrusse metà di Roccavecchia. Tuo padre, un Eroe della Gilda, scomparve tra le ceneri.',
    'Da quel giorno, un uomo con una maschera bianca infesta i tuoi sogni: Jack of Blades.',
    '',
    'Sei cresciuto. La spada di tuo padre è appesa al muro, e il suo vecchio cane, Strappo, non ti abbandona mai.',
    'Oggi il Sindaco ti ha mandato a chiamare. Forse è solo questione di lupi.',
    'O forse il destino, finalmente, è venuto a bussare.',
    '',
    'Ogni tua azione peserà sulla bilancia: sarai un santo acclamato dalle folle... o un mostro temuto da Albion intera?'
  ];

  window.DATA = { QUESTS, ITEMS, SHOPS, DIALOGS, INTRO, renownTitle };
})();
