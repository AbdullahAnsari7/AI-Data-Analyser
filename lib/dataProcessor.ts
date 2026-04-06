export function processData(data: any[], query: any) {
  const { operation, column, metric, limit } = query

  if (!data || data.length === 0) return []

  switch (operation) {
    case "top":
      return [...data]
        .sort((a, b) => Number(b[metric]) - Number(a[metric]))
        .slice(0, limit || 5)

    case "sum":
      return [
        {
          label: column,
          value: data.reduce((acc, row) => acc + Number(row[column] || 0), 0),
        },
      ]

    case "average":
      return [
        {
          label: column,
          value:
            data.reduce((acc, row) => acc + Number(row[column] || 0), 0) /
            data.length,
        },
      ]

    case "group": {
      const grouped: Record<string, number> = {}

      data.forEach((row) => {
        const key = row[column]
        grouped[key] = (grouped[key] || 0) + Number(row[metric] || 0)
      })

      return Object.entries(grouped).map(([key, value]) => ({
        label: key,
        value,
      }))
    }

    default:
      return []
  }
}