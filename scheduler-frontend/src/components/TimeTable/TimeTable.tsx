export const TimeTable = () => {
  return (
    <div className="w-full border border-table-line rounded-lg">
      <table className="w-full">
        <colgroup>
          <col span={1} className="border-r" />
        </colgroup>
        <thead className="border-b">
          <tr>
            <th>Time</th>
            <th colSpan={2}>Classes</th>
          </tr>
        </thead>

        <tbody className="divide-y">
          <tr>
            <td>18:00</td>
            <td>
              <>
                <div>John</div>
                <div>Guitar</div>
              </>
            </td>
            <td>
              <>
                <div>John</div>
                <div>Guitar</div>
              </>
            </td>
          </tr>
          <tr>
            <td>18:30</td>
            <td>
              <>
                <div>John</div>
                <div>Guitar</div>
              </>
            </td>
            <td>
              <>
                <div>John</div>
                <div>Guitar</div>
              </>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
