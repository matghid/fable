# Cartella asset

Il gioco carica automaticamente i PNG elencati sotto, se presenti. Se un file
manca, usa la grafica procedurale: **nessun asset è obbligatorio**.

## File attesi

| File | Dimensioni | Uso | Note |
|---|---|---|---|
| `bg_title.png` | 960×540 | Schermata del titolo | Illustrazione pixel art: borgo medievale fantasy al tramonto, stile Fable/Bowerstone. Il testo del titolo viene disegnato sopra dal gioco: lasciare la fascia centrale-alta poco affollata. |
| `bg_intro.png` | 960×540 | Prologo | Notte d'incendio a Roccavecchia, silhouette di Jack of Blades. Viene scurita al 60% per il testo. |
| `bg_ending_good.png` | 960×540 | Finale buono | Alba dorata su Albion, eroe e cane in controluce. |
| `bg_ending_evil.png` | 960×540 | Finale malvagio | Trono oscuro, spada conficcata, toni rosso sangue. |
| `hero_sheet.png` | 128×192 | Sprite dell'eroe | **Sfondo trasparente.** Griglia 4×4 di frame 32×48. Colonne: 0 fermo, 1-2 camminata, 3 attacco. Righe: 0 fronte (giù), 1 sinistra, 2 destra, 3 spalle (su). |
| `ui_frame.png` | 96×96 | Cornici di menu e dialoghi | **Sfondo del centro semi-trasparente scuro.** Cornice ornata oro/legno in stile medievale; disegnata in 9-slice con bordo sorgente di 24 px (angoli intatti, bordi stirati). |

## Prompt suggeriti per la generazione (Higgsfield o altro)

- **bg_title**: "2D pixel art, medieval fantasy village at golden hour, cobblestone
  streets, half-timbered houses, distant castle silhouette, Fable-inspired
  Bowerstone aesthetic, rich warm palette, 16:9, highly detailed pixel art,
  no text"
- **bg_intro**: "2D pixel art, village burning at night, silhouette of a masked
  figure in a crimson hood watching the flames, embers in the sky, dramatic,
  16:9, no text"
- **bg_ending_good**: "2D pixel art, golden sunrise over rolling green hills,
  hero and dog silhouette on a hilltop, hopeful storybook mood, 16:9, no text"
- **bg_ending_evil**: "2D pixel art, dark throne room, glowing cursed sword
  planted in stone, blood red banners, ominous mood, 16:9, no text"
- **hero_sheet**: "2D pixel art character sprite sheet, male hero, medieval
  fantasy, blue tunic and leather, 4x4 grid, 32x48px per frame, columns:
  idle/walk1/walk2/attack, rows: front/left/right/back, dark selective outline,
  transparent background, clean pixel art"
- **ui_frame**: "2D pixel art UI frame, medieval fantasy ornate border, gold
  trim on dark wood, 96x96px, decorated corners, dark semi-transparent center,
  transparent outside, pixel art style"

## Requisiti tecnici

- Formato **PNG** (con canale alfa dove indicato).
- Le sprite sheet devono rispettare la griglia esatta: il gioco ritaglia i frame
  con `drawImage(sheet, col*32, row*48, 32, 48, ...)`.
- Dopo aver aggiunto i file, basta ricaricare la pagina: nessuna modifica al
  codice necessaria.
