# app-analytics-data

auto generate analytics data for the phala analytics app.

## Install

```
yarn install
```

## Scripts

### generate newest data

```
yarn run daily-data
```

### generate chart data

```
yarn run chart-data
```

## History Data

You can directly run the following command to generate the history data.
You also use the [web tool](https://block-analytics-data-web.netlify.app/) to generate the history data.

### Step1

```
git checkout test
```

### Step2

Change the [`dumpSnapshots.ts`](https://github.com/Phala-Network/app-analytics-data/blob/test/src/dumpSnapshots.ts) file [`startNum`](https://github.com/Phala-Network/app-analytics-data/blob/test/src/dumpSnapshots.ts#L20) value.

### Step3

```
npm run history-data
```
