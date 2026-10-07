Coloring Dictionary website icons v2

Dark teal buttons: cd-arrow-cream.svg
Yellow or orange buttons: cd-arrow-teal.svg
Gold Color Learn Grow strip: cd-sparkle-teal.svg
Dark backgrounds: cd-sparkle-cream.svg

These files have fixed colors and native 24px dimensions so they also work
as ordinary img elements. Do not apply brightness/invert filters or opacity.
Remove older icon width constraints and theme rules that shrink or recolor them.

HTML:
<a class="cta" href="YOUR_LINK">View on Amazon
  <img class="cd-icon" src="/assets/cd-arrow-cream.svg" alt="" aria-hidden="true" width="24" height="24">
</a>

CSS:
.cta { display: inline-flex; align-items: center; justify-content: center; gap: 10px; }
.cd-icon { display: block; width: 24px; height: 24px; min-width: 24px;
  flex: 0 0 24px; object-fit: contain; opacity: 1; }
.color-strip .cd-icon { width: 24px; height: 24px; }

Use at 24px first. If a compact button needs a smaller icon, use at least 20px
and update width, height, min-width, and flex-basis together.
Preserve the text link as the accessible label; the beside-text icon is decorative.
