import re

with open("src/pages/Charts.tsx", "r") as f:
    content = f.read()

# Replace priceScaleId: id, with priceScaleId: 'left',
content = content.replace("priceScaleId: id,", "priceScaleId: 'left',")

# Fix the useEffect
old_margin_code = """      // Apply identical margins to all active oscillators so they overlap in the bottom pane
      if (bottomPaneActive) {
        bottomIndicators.forEach(id => {
          try {
            chart.priceScale(id).applyOptions({
              scaleMargins: { top: 1 - totalRatio, bottom: 0 },
              borderColor: '#E2E8F0',
            });
          } catch(e) {}
        });
      }"""

new_margin_code = """      // Apply margins to the shared left price scale for all oscillators
      if (bottomPaneActive) {
        try {
          chart.priceScale('left').applyOptions({
            scaleMargins: { top: 1 - totalRatio, bottom: 0 },
            borderColor: '#E2E8F0',
          });
        } catch(e) {}
      }"""

if old_margin_code in content:
    content = content.replace(old_margin_code, new_margin_code)
else:
    print("Warning: old margin code not found")

with open("src/pages/Charts.tsx", "w") as f:
    f.write(content)

print("Done")
