const { v4: uuidv4 } = require("uuid");
const { S3, PutObjectCommand } = require("@aws-sdk/client-s3");
const { S3RequestPresigner } = require("@aws-sdk/s3-request-presigner");
const { createRequest } = require("@aws-sdk/util-create-request");
const { formatUrl } = require("@aws-sdk/util-format-url");

const s3Client = new S3({ region: "eu-central-1" });
const signedRequest = new S3RequestPresigner(s3Client.config);

const generateSignUrl = async ({ Bucket, Key }) => {
  try {
    const request = await createRequest(
      s3Client,
      new PutObjectCommand({
        Bucket,
        Key,
      })
    );
    const signedUrl = formatUrl(
      await signedRequest.presign(request, {
        expiresIn: 60 * 60 * 24,
      })
    );
    return signedUrl;
  } catch (err) {
    throw err;
  }
};

module.exports.handler = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  console.log(event);
  const id = uuidv4();

  try {
    const uploadUrl = await generateSignUrl({
      Bucket: `eagle-uploads-bucket`,
      Key: `${id}.mp3`,
    });

    callback(null, {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        uploadUrl,
      }),
    });
  } catch (err) {
    console.log("Error creating presigned URL", err);
    callback(null, {
      statusCode: 502,
      body: err,
    });
  }
};
