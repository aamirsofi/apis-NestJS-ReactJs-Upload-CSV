import { CsvData } from "../types";

interface CsvPreviewProps {
  data: CsvData;
  onReset: () => void;
}

const CsvPreview: React.FC<CsvPreviewProps> = ({ data, onReset }) => {
  const headers = data.data.length > 0 ? Object.keys(data.data[0]) : [];

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            CSV Import Successful!
          </h2>
          <p className="text-gray-600 mt-1">
            {data.totalRows} row{data.totalRows !== 1 ? "s" : ""} imported
          </p>
        </div>
        <button
          onClick={onReset}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Upload Another File
        </button>
      </div>

      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-green-800">
          <span className="font-semibold">✓ {data.message}</span>
        </p>
      </div>

      {data.data.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No data to display</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {headers.map((header, index) => (
                  <th
                    key={index}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.data.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50">
                  {headers.map((header, colIndex) => (
                    <td
                      key={colIndex}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                    >
                      {row[header] || "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CsvPreview;
