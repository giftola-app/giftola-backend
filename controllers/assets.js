const { StatusCodes } = require("http-status-codes");
const { UnauthenticatedError, BadRequestError } = require("../errors");
const crypto = require("crypto");

const uploadImage = async (req, res) => {
  const bucket = req.bucket;

  if (!req.file) {
    throw new BadRequestError("No file uploaded");
  }

  const blob = bucket.file(`assets/${randomImageName()}.png`);
  const blobStream = await blob.createWriteStream({});

  blobStream.on("error", (err) => {
    throw new BadRequestError(err.message);
  });

  blobStream.on("finish", async () => {
    await blob.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;

    res.status(StatusCodes.OK).json({
      code: "asset_upload",
      message: "Asset uploaded successfully",
      data: {
        url: publicUrl,
      },
    });

    // res.status(StatusCodes.OK).json({
    //   code: "asset_upload",
    //   message: "Asset uploaded successfully",
    //   data: {
    //     url: publicUrl,
    //   },
    // });
  });

  blobStream.end(req.file.buffer);
};

module.exports = {
  uploadImage,
};

const randomImageName = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString("hex");
};
