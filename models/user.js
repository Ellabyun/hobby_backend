import mongoose from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 6 },
  avatar: {
    url: { type: String, required: true },
    filename: { type: String, required: true },
  },
  posts: [{ type: mongoose.Types.ObjectId, required: true, ref: 'Post' }],
});

userSchema.plugin(uniqueValidator);

export default mongoose.model('User', userSchema);
