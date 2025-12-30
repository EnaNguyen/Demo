import {
  FilterGroup,
  DataInput,
  DataObject,
  FilterOption,
  FilterRequest,
  Result,
} from '../../type/filter/filter';

function onFilterSelect(filterGroups: FilterGroup): { results: Result; url: string } {
  let resultsFilter: Result = { key: [] };
  const urlParams: URLSearchParams = new URLSearchParams();

  try {
    let dataSource = filterGroups.DataInput?.dataSource;   
    if (dataSource) {
      let allowedKeys: (string | number)[] | null = null; 
      for (let option of filterGroups.request) {
        const paramName = option.title.toLowerCase().replace(/\s+/g, '');
        const matchingKeys: Set<string | number> = new Set();

        switch (option.type) {
          case 'checkbox': {
            const values = option.request.value as Array<string | number | boolean>;
            if (values && Array.isArray(values)) {
              values.forEach((v) => urlParams.append(paramName, String(v)));

              for (let d of dataSource) {
                for (let prop of d.properties || []) {
                  if (prop.label == option.target && values.includes(prop.value)) {

                    matchingKeys.add(d.key as string | number);
                    break;
                  }
                }
              }
            }
            break;
          }
          case 'select': {
            const value = option.request.value as string | number | boolean;
            if (value !== undefined) {
              urlParams.set(paramName, String(value));
            }
            for (let d of dataSource) {
              for (let prop of d.properties || []) {
                if (prop.label == option.target && prop.value == value) {
                  matchingKeys.add(d.key as string | number);
                  break;
                }
              }
            }
            break;
          }
          case 'range': {
            const rqType = option.request.type;
            if (rqType === 'number') {
              const range = option.request.range as { min: number; max: number };
              urlParams.set(paramName + 'Min', String(range.min));
              urlParams.set(paramName + 'Max', String(range.max));
              for (let d of dataSource) {
                for (let prop of d.properties || []) {
                  const val = Number(prop.value);
                  if (prop.label == option.target && val >= range.min && val <= range.max) {
                    matchingKeys.add(d.key as string | number);
                    break;
                  }
                }
              }
            } else {
              const range = option.request.range as { min: Date; max: Date };
              urlParams.set(paramName + 'Min', range.min.toISOString());
              urlParams.set(paramName + 'Max', range.max.toISOString());
              for (let d of dataSource) {
                for (let prop of d.properties || []) {
                  const val = new Date(prop.value).getTime();
                  if (prop.label == option.target && val >= range.min.getTime() && val <= range.max.getTime()) {
                    matchingKeys.add(d.key as string | number);
                    break;
                  }
                }
              }
            }
            break;
          }
          case 'search': {
            const value = option.request.value as string;
            if (value) {
              urlParams.set(paramName, value);
            }
            for (let d of dataSource) {
              for (let prop of d.properties || []) {
                if (
                  prop.label == option.target &&
                  prop.value &&
                  String(prop.value).toLowerCase().includes(value.toLowerCase())
                ) {
                  matchingKeys.add(d.key as string | number);
                  break;
                }
              }
            }
            break;
          }
          case 'page': {
            const page = option.request.page as number;
            const pageSize = option.request.pageSize as number;
            urlParams.set('page', String(page));
            urlParams.set('pageSize', String(pageSize));
            break;
          }
          case 'radio': {
            const value = option.request.value as string | number | boolean;
            if (value !== undefined) {
              urlParams.set(paramName, String(value));
            }
            for (let d of dataSource) {
              for (let prop of d.properties || []) {
                if (prop.label == option.target && prop.value == value) {
                  matchingKeys.add(d.key as string | number);
                  break;
                }
              }
            }
            break;
          }
        }

        if (matchingKeys.size > 0) {
          if (allowedKeys === null) {
            allowedKeys = Array.from(matchingKeys);
          } else {
            allowedKeys = allowedKeys.filter((key) => matchingKeys.has(key));
          }
        }
      }
      let filteredData = dataSource;
      if (allowedKeys !== null) {
        filteredData = dataSource.filter((item) => allowedKeys!.includes(item.key as string | number));
      }

      const pageOption = filterGroups.request.find((opt) => opt.type === 'page');
      if (pageOption) {
        const page = pageOption.request.page as number;
        const pageSize = pageOption.request.pageSize as number;
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        filteredData = filteredData.slice(startIndex, endIndex);
      }
      filteredData.forEach((item) => {
        if (item.key) {
          resultsFilter.key.push(item.key);
        }
      });
    }
  } catch (error) {
    return { results: resultsFilter, url: '' };
  }

  const baseUrl = 'http://localhost:4200/user';
  const queryString = urlParams.toString();
  const fullUrl = queryString ? `${baseUrl}?${queryString}` : baseUrl;
  return { results: resultsFilter, url: fullUrl };
}

function parseUrlFilters(params: any, filterConfig: FilterGroup): void {
  if (!filterConfig.request || filterConfig.request.length === 0) {
    return;
  }

  for (let option of filterConfig.request) {
    const paramName = option.title.toLowerCase().replace(/\s+/g, '');

    try {
      switch (option.type) {
        case 'checkbox': {
          const paramValue = params[paramName];
          if (paramValue) {
            const values = paramValue.split(',').map((v: string) => {
              const num = Number(v);
              return isNaN(num) ? v : num;
            });
            option.request.value = values;
          }
          break;
        }

        case 'select':
        case 'radio': {
          const paramValue = params[paramName];
          if (paramValue !== undefined) {
            const num = Number(paramValue);
            option.request.value = isNaN(num) ? paramValue : num;
          }
          break;
        }

        case 'range': {
          const rqType = option.request.type;
          const minParam = paramName + 'Min';
          const maxParam = paramName + 'Max';

          if (rqType === 'number') {
            const min = params[minParam];
            const max = params[maxParam];
            if (min !== undefined && max !== undefined) {
              option.request.range = {
                min: Number(min),
                max: Number(max),
              };
            }
          } else if (rqType === 'date') {
            const min = params[minParam];
            const max = params[maxParam];
            if (min !== undefined && max !== undefined) {
              option.request.range = {
                min: new Date(min),
                max: new Date(max),
              };
            }
          }
          break;
        }

        case 'search': {
          const paramValue = params[paramName];
          if (paramValue) {
            option.request.value = paramValue;
          }
          break;
        }

        case 'page': {
          const page = params['page'];
          const pageSize = params['pageSize'];
          if (page !== undefined) {
            option.request.page = Number(page);
          }
          if (pageSize !== undefined) {
            option.request.pageSize = Number(pageSize);
          }
          break;
        }
      }
    } catch (error) {
      console.error(`Error parsing filter '${option.title}':`, error);
    }
  }
}

export { onFilterSelect, parseUrlFilters };
