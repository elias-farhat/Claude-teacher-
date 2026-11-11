# ToonHead style study (DiceBear "toon-head", Johan Melin, CC BY 4.0)
Source: github.com/dicebear/styles → src/toon-head.json (Figma export). Credit line needed in video descriptions.

## Construction (what makes the look)
- Canvas 768×768. Head 395×452 at (186,140); eyes at y≈405 (≈ half the head), face ~300 px wide.
- Flat fills only. No gradients, no textures.
- Thin black outline (stroke #000, width 2 at 768) on the big silhouettes only: head, body, clothes, hair. Features (eyes, brows, mouth) have NO outline.
- Shading = ONE flat shape per part filled black at 20% opacity (fill-opacity .2): under the chin on the neck, collar inner edge, ear insides, under the nose.
- Eyes: cream sclera #f6f1e4 almond, a big dark iris #4b2422 (r≈27) filling most of it, eyelash flick shapes in the same dark brown. No white highlight.
- Brows/beard use the hair colour. Mouth inside #611519, tongue #e0564b, teeth cream.
- Head shape: wide cranium, ears drawn as part of the head silhouette, soft jaw, tiny nose (two small marks).
- Body: shoulders as one big rounded dome (521 wide) with a short neck; clothes sit over it with their own outline.

## Palettes
- skin: #5c3829 #a36b4f #b98e6a #c68e7a #f1c3a5
- hair: #2c1b18 #724133 #a55728 #b58143 #d6b370
- clothes: #0b3286 #147f3c #151613 #545454 #731ac3 #b11f1f #e8e9e6 #eab308 #ec4899 #f97316

## Parts available
eyes: bow, happy (closed), humble, wide, wink · mouth: agape, angry, laugh, sad, smile · brows: angry, happy, neutral, raised, sad
hair: bun, sideComed, spiky, undercut · rearHair: longStraight, longWavy, neckHigh, shoulderHigh · beard: 5 · clothes: dress, openJacket, shirt, tShirt, turtleNeck

## Rules for new poses we draw ourselves (study/*.svg)
Same flat fills + black outline on silhouettes + one 20%-black shadow shape per part; reuse the library head whenever the view is frontal;
profile/top views copy its eye (cream + dark iris), mouth colours and tiny nose.
