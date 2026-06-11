# Albion: Cronache di un Eroe

Un action-RPG 2D in pixel art per browser, omaggio a **Fable**, **Fable II** e **Fable III**.
Nessuna dipendenza: solo HTML5 Canvas e JavaScript puro.

## Come si gioca

Apri `index.html` in un browser moderno, oppure servi la cartella in locale:

```bash
npx http-server .        # poi apri http://localhost:8080
# o in alternativa
python3 -m http.server   # poi apri http://localhost:8000
```

## Comandi

| Tasto | Azione |
|---|---|
| WASD / frecce | Movimento |
| J / Spazio | Attacco con la spada |
| K | Attacco a distanza (arco, poi pistola) |
| L | Palla di fuoco (consuma Volontà) |
| H | Incantesimo di cura |
| E | Interagisci: parla, scava, cattura, compra case |
| 1 / 2 | Pozione di vita / di Volontà |
| C | Scheda personaggio e potenziamenti |
| Q | Registro delle missioni |
| Esc | Pausa / salvataggio |

## Caratteristiche (in puro spirito Fable)

- **Moralità**: ogni scelta sposta la bilancia tra santo e malvagio. Aureola dorata o
  aura demoniaca, sconti dai mercanti o cittadini in fuga, dialoghi che cambiano.
- **Tre discipline**: Forza (mischia), Abilità (distanza), Volontà (magia), potenziabili
  raccogliendo le orbe di esperienza lasciate dai nemici.
- **Il cane Strappo**: combatte al tuo fianco e fiuta i tesori sepolti, abbaiando
  quando c'è qualcosa da dissotterrare.
- **Economia**: oro, negozi con prezzi legati alla reputazione, e case acquistabili a
  Borgopietra che generano affitti — come in Fable II e III.
- **Missioni**: una campagna principale in 5 atti contro Jack of Blades, più missioni
  secondarie con scelte morali (la torta di Nonna Rosa, il bandito ferito, le galline
  del contadino... e sì, puoi prendere a calci le galline).
- **5 regioni**: Roccavecchia, Boscocupo, Borgopietra, il Cimitero di Pratolargo e la
  Tana di Jack, con ciclo giorno/notte.
- **Doppio finale**: distruggi la Spada di Aeons o impugnala. Albion ricorderà.
- **Salvataggio automatico** in `localStorage` (più salvataggio manuale dal menu).

## Struttura del codice

```
index.html        pagina e canvas
style.css         layout e resa pixelata
js/sprites.js     pixel art generata proceduralmente
js/maps.js        le 5 regioni (tilemap testuali)
js/data.js        missioni, oggetti, negozi, dialoghi
js/game.js        motore: combattimento, IA, missioni, salvataggi
js/ui.js          rendering di mondo, HUD e menu
js/main.js        input, audio sintetizzato, ciclo di gioco
test/smoke.js     test headless dell'intera campagna (node test/smoke.js)
```

## Test

```bash
node test/smoke.js
```

Il test simula DOM e canvas, poi gioca l'intera campagna: movimento, combattimento,
tutte le missioni, negozi, proprietà, boss finale, morte/resurrezione e salvataggi.
