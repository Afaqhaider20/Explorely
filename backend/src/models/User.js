import mongoose from 'mongoose';
import passportLocalMongoose from 'passport-local-mongoose';

// Define a User Schema

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
  });
  
  // whenever the user collection is converted to a json to be retrieved on the client side
  // these entries are inherently deleted, this saves the user data to be exploited through scam requests
  userSchema.set('toJSON', {
    transform: (_, ret) => {
      delete ret.email;
      delete ret.salt;
      delete ret.hash;
      delete ret.__v; 
    },
  });
  
  
  
  // this is to connect  passport-local-mongoose to the mongoose schema.
  // this automatically handles and implements passport-local-strategy, encryption(salting & hashing) and session management.
  userSchema.plugin(passportLocalMongoose);
  
  
  // Create User Model
  const User = mongoose.model('User', userSchema);

  export default User;
