import React from 'react';
import './DataTable.css';

const DataTable = ({ 
  columns, 
  data, 
  onRowClick,
  actions,
  emptyMessage = 'No data available'
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="data-table-empty">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="data-table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th key={index} className={column.align ? `text-${column.align}` : ''}>
                {column.header}
              </th>
            ))}
            {actions && <th className="text-right">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr 
              key={rowIndex} 
              onClick={() => onRowClick && onRowClick(row)}
              className={onRowClick ? 'clickable' : ''}
            >
              {columns.map((column, colIndex) => {
                const accessor = column.accessor || column.key;
                // Safety check: ensure accessor is a valid string/number
                if (!accessor || (typeof accessor !== 'string' && typeof accessor !== 'number')) {
                  console.warn('DataTable: Column missing valid accessor or key', { column });
                  return (
                    <td key={colIndex} className={column.align ? `text-${column.align}` : ''}>
                      {/* Column missing accessor */}
                    </td>
                  );
                }
                
                let cellValue;
                try {
                  cellValue = row[accessor];
                } catch (e) {
                  console.error('DataTable: Error accessing cell value', { accessor, row, error: e });
                  cellValue = null;
                }
                
                // Support render patterns: (value, row) when accessor is defined, (row) when no accessor
                // Always pass (cellValue, row) when accessor exists so render functions can use either parameter
                let renderedContent;
                if (column.render) {
                  try {
                    let renderResult;

                    // Choose how to call render based on function arity to support existing components
                    const fnArity = column.render.length || 0;
                    if (fnArity >= 2) {
                      // render expects (value, row)
                      renderResult = column.render(cellValue, row);
                    } else if (fnArity === 1) {
                      // render expects a single arg - pass the cell value (most renderers expect the value)
                      renderResult = column.render(cellValue);
                    } else {
                      // No args expected? call with cellValue for safety
                      renderResult = column.render(cellValue, row);
                    }
                    
                    // Validate render result is not an object (unless it's a React element)
                    if (renderResult !== null && renderResult !== undefined && typeof renderResult === 'object') {
                      if (!React.isValidElement(renderResult)) {
                        // Render function returned a plain object - this is an error
                        console.error('DataTable: Render function returned an object. Column:', column.header || accessor, 'Result:', renderResult);
                        renderResult = '';
                      }
                    }
                    renderedContent = renderResult;
                  } catch (e) {
                    console.error('DataTable: Error in render function', { column: column.header || accessor, error: e });
                    renderedContent = '';
                  }
                } else {
                  // If no render function, render the cell value directly
                  // Ensure we don't render objects - only primitives are allowed
                  if (cellValue === null || cellValue === undefined) {
                    renderedContent = '';
                  } else if (typeof cellValue === 'object') {
                    // Objects (including arrays) cannot be rendered directly
                    // Check if it's the entire row object (which would be a bug)
                    if (cellValue === row) {
                      console.error('DataTable: Column accessor returned entire row object. This is a bug!', { column, accessor, row });
                      renderedContent = '';
                    } else if (Array.isArray(cellValue)) {
                      // Arrays can be rendered as comma-separated strings
                      renderedContent = cellValue.join(', ');
                    } else {
                      // Other objects cannot be rendered
                      console.warn('DataTable: Attempted to render object directly. Column accessor may be incorrect.', { column, accessor, cellValue });
                      renderedContent = '';
                    }
                  } else {
                    // Primitives (string, number, boolean) can be rendered
                    renderedContent = cellValue;
                  }
                }
                
                // Final safety check: ensure renderedContent is not an object (unless it's a React element)
                // This is a last resort check - should have been caught earlier
                if (renderedContent !== null && renderedContent !== undefined) {
                  const contentType = typeof renderedContent;
                  if (contentType === 'object') {
                    // Check if it's a React element
                    if (React.isValidElement(renderedContent)) {
                      // Valid React element - OK to render
                    } else if (Array.isArray(renderedContent)) {
                      // Array - convert to string (shouldn't happen but handle it)
                      console.warn('DataTable: FINAL CHECK - Array detected in renderedContent. Converting to string.', { column: column.header || accessor });
                      renderedContent = renderedContent.join(', ');
                    } else {
                      // Plain object - this is an error
                      console.error('DataTable: FINAL CHECK - Object detected in renderedContent!', { 
                        column: column.header || accessor, 
                        accessor,
                        renderedContentKeys: Object.keys(renderedContent),
                        rowKeys: Object.keys(row),
                        cellValueType: typeof cellValue,
                        cellValue,
                        hasRender: !!column.render
                      });
                      renderedContent = '';
                    }
                  }
                }
                
                return (
                  <td key={colIndex} className={column.align ? `text-${column.align}` : ''}>
                    {renderedContent}
                  </td>
                );
              })}
              {actions && (
                <td className="text-right">
                  <div className="data-table-actions">
                    {actions(row)}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;

