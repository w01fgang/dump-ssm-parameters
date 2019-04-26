const AWS = require("aws-sdk");
AWS.config.apiVersions = {
  ssm: "2014-11-06",
};

const ssm = new AWS.SSM({});

const listParameters = async NextToken => {
  const params = { NextToken };
  const result = await ssm.describeParameters(params).promise();
  return [
    ...result.Parameters,
    ...(result.NextToken ? await listParameters(result.NextToken) : []),
  ];
};

async function getParametersHelper(list) {
  const MAX_NAMES = 10;
  const hasMoreItems = list.length > MAX_NAMES;
  const nextIndex = MAX_NAMES - 1;
  const names = list.slice(0, nextIndex);

  const currentResult = await ssm
    .getParameters({
      Names: names,
    })
    .promise();

  return [
    ...currentResult.Parameters,
    ...(hasMoreItems ? await getParametersHelper(list.slice(nextIndex)) : []),
  ];
}

const execute = async () => {
  const parametersList = await listParameters();
  const envFromSSM = await getParametersHelper(
    parametersList.map(el => el.Name)
  );
  console.log("envFromSSM", envFromSSM.map(el => ({ [el.Name]: el.Value })));
};

execute()
  .then(() => console.log("OK"))
  .catch(e => console.log(e));

