import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const postSchema = new Schema(
  {
    images: [
      {
        url: { type: String, required: true },
        filename: { type: String, required: true },
      },
    ],
    comment: { type: String, required: true },
    creator: { type: mongoose.Types.ObjectId, required: true, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('Post', postSchema);
