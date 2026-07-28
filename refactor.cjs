const fs = require('fs');

let content = fs.readFileSync('src/components/ChartPane.tsx', 'utf8');

// Replace component declaration
content = content.replace(
  'export default function Charts() {',
  'export const ChartPane = ({ paneId, symbol, exchange, timeframe, isActive, onClick, activeDrawingTool, setActiveDrawingTool }: any) => {'
);

// Remove global hooks
content = content.replace(/const navigate = useNavigate\(\);\n/, '');
content = content.replace(/const { selectedSymbol, selectedExchange, setSelectedSymbol } = useMarketStore\(\);\n/, '');
content = content.replace(/const fullScreenRef = useRef<HTMLDivElement>\(null\);\n/, '');
content = content.replace(/const \[timeframe, setTimeframe\] = useState<Timeframe>\('15m'\);\n/, '');
content = content.replace(/const \[searchQuery, setSearchQuery\] = useState\(''\);\n/, '');
content = content.replace(/const \[searchResults, setSearchResults\] = useState<ReturnType<typeof searchStocks>>\(\[\]\);\n/, '');
content = content.replace(/const \[activeDrawingTool, setActiveDrawingTool\] = useState<DrawingType>\('cursor'\);\n/, '');
content = content.replace(/const \[isSidebarOpen, setIsSidebarOpen\] = useState\(true\);\n/, '');


// Replace selectedSymbol with symbol, selectedExchange with exchange
content = content.replace(/selectedSymbol/g, 'symbol');
content = content.replace(/selectedExchange/g, 'exchange');

// Clean up the return block
// The return block starts at `return (`
const returnStartIndex = content.indexOf('return (');
if (returnStartIndex > -1) {
  const chartContainerIndex = content.indexOf('{/* Chart Container */}');
  const endOfChartContainerIndex = content.indexOf('{/* Alert Modal */}');
  
  if (chartContainerIndex > -1 && endOfChartContainerIndex > -1) {
    const chartContainerHtml = content.substring(chartContainerIndex, endOfChartContainerIndex);
    const modalsHtml = content.substring(endOfChartContainerIndex);
    
    const newReturnBlock = `return (
    <div 
      onClick={onClick} 
      style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden', 
        border: isActive ? '2px solid #0E7490' : '1px solid transparent', 
        borderRadius: 4, 
        position: 'relative',
        boxSizing: 'border-box'
      }}
    >
      ${chartContainerHtml}
      ${modalsHtml}`;

    content = content.substring(0, returnStartIndex) + newReturnBlock;
  }
}

// Remove the outermost </div></div> that belonged to the previous wrappers
// Just remove the last two `</div>` in the file.
let lastDiv = content.lastIndexOf('</div>');
if (lastDiv > -1) content = content.substring(0, lastDiv) + content.substring(lastDiv + 6);
lastDiv = content.lastIndexOf('</div>');
if (lastDiv > -1) content = content.substring(0, lastDiv) + content.substring(lastDiv + 6);


fs.writeFileSync('src/components/ChartPane.tsx', content);
console.log('ChartPane.tsx refactored');
