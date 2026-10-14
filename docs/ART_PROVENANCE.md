# Backdrop art provenance

`src/assets/backdrop/harbour-*.{avif,webp}` were generated in Devin with the `generate_image` tool (model reported as gpt-image-2.5-flare). Input was a text prompt only, with no reference or input images. The 1536×1024 PNG master is not committed; `scripts/art/encode-backdrop.py` encodes the shipped sizes from it.

Prompt:

> Cinematic, photorealistic matte-painting wide landscape of a Norse fjord harbour at night during a brooding storm, digital painting with film-like realism. Composition, important: the CENTER of the frame is calm dark open water fading into misty distance with a narrow fjord valley between towering snow-dusted granite cliffs, low and uncluttered in the middle. Detail is at the LEFT and RIGHT edges. On the left: a wooden Viking village with carved dragon-gable longhouses, a timber pier, warm torches and braziers glowing amber, reflections on wet planks. On the right: the carved wooden dragon-head prow of a moored longship in the foreground, and more longhouses with a few warm lit windows. In the middle distance two small Viking longships with square dark-red sails glide toward the viewer on the water, round shields along the hull. Heavy dark storm clouds with a faint pale moonlit break, drifting mist low on the water, cold teal and deep navy palette with weathered gold and amber firelight highlights, restrained and moody, high dynamic range. No people in close-up, no text, no logos, no watermark.

The previous procedural backdrop (`scripts/art/generate-fjord.py`) is kept for reference.
