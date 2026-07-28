import re

with open("src/pages/Charts.tsx", "r") as f:
    content = f.read()

# Replace priceScaleId: 'left' -> priceScaleId: id in RSI, MACD, ATR blocks
# We only want to replace it for RSI, MACD, ATR.
# Since volume has priceScaleId: '', we can safely replace all `priceScaleId: 'left'` in the file since only oscillators use 'left'.
content = content.replace("priceScaleId: 'left',", "priceScaleId: id,")

# Remove the inline scale margin applies in the indicator setup
# 1. RSI
content = re.sub(r"chart\.priceScale\('left'\)\.applyOptions\(\{\s*scaleMargins: \{ top: 1 - rsiHeightRatioRef\.current, bottom: 0 \},\s*borderColor: '#f0f0f0',\s*\}\);", "", content)
# 2. MACD
# 3. ATR
# The regex above will catch all of them if they match.

# Replace the layout useEffects
layout_effect_regex = re.compile(
    r"// Handle right price scale margins dynamically.*?}, \[rsiHeightRatio, activeIndicators\]\);", 
    re.DOTALL
)

new_layout_effect = """  // Handle all price scale margins dynamically
  useEffect(() => {
    if (chartRef.current) {
      const chart = chartRef.current;
      const bottomIndicators = activeIndicators.filter(id => id.startsWith('RSI') || id.startsWith('MACD') || id.startsWith('ATR'));
      const oscillatorCount = bottomIndicators.length;
      const bottomPaneActive = oscillatorCount > 0;
      const totalRatio = rsiHeightRatio;
      
      chart.priceScale('right').applyOptions({
        scaleMargins: { top: 0.1, bottom: bottomPaneActive ? totalRatio : 0.05 },
      });

      // Update volume margins
      Object.keys(seriesRef.current).forEach(id => {
        if (id.startsWith('VOLUME')) {
          const series = seriesRef.current[id];
          if (series) {
             const bottomMargin = bottomPaneActive ? totalRatio : 0.05;
             series.priceScale().applyOptions({ scaleMargins: { top: 1 - bottomMargin - 0.2, bottom: bottomMargin } });
          }
        }
      });

      // Distribute pane space evenly among active oscillators
      if (bottomPaneActive) {
        const paneHeight = totalRatio / oscillatorCount;
        bottomIndicators.forEach((id, index) => {
          const topMargin = 1 - totalRatio + (index * paneHeight);
          const bottomMargin = totalRatio - ((index + 1) * paneHeight);
          try {
            chart.priceScale(id).applyOptions({
              scaleMargins: { top: topMargin, bottom: bottomMargin },
              borderColor: '#E2E8F0',
            });
          } catch(e) {}
        });
      }
    }
  }, [rsiHeightRatio, activeIndicators]);"""

content = layout_effect_regex.sub(new_layout_effect, content)

# Update drag handle condition
# from: activeIndicators.some(id => id.startsWith('RSI'))
# to: activeIndicators.some(id => id.startsWith('RSI') || id.startsWith('MACD') || id.startsWith('ATR'))
content = content.replace("activeIndicators.some(id => id.startsWith('RSI'))", "activeIndicators.some(id => id.startsWith('RSI') || id.startsWith('MACD') || id.startsWith('ATR'))")

with open("src/pages/Charts.tsx", "w") as f:
    f.write(content)
