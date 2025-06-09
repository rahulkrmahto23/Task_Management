import mongoose, { Document, Schema, Types } from "mongoose";
import User from "./userSchema";

export interface ITeam extends Document {
  name: string;
  description?: string;
  members: Types.ObjectId[];
  projects: Types.ObjectId[];
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TeamSchema: Schema = new Schema<ITeam>(
  {
    name: {
      type: String,
      required: [true, "Team name is required"],
      trim: true,
      minlength: [2, "Team name must be at least 2 characters"],
      maxlength: [100, "Team name cannot exceed 100 characters"],
      unique: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    projects: [
      {
        type: Schema.Types.ObjectId,
        ref: "Project",
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

TeamSchema.virtual("memberCount").get(function () {
  return Array.isArray(this.members) ? this.members.length : 0;
});

TeamSchema.virtual("projectCount").get(function () {
  return Array.isArray(this.projects) ? this.projects.length : 0;
});

TeamSchema.post("save", async function (doc) {
  await User.updateMany(
    { _id: { $in: doc.members } },
    { $addToSet: { teams: doc._id } }
  );
});

const Team = mongoose.model<ITeam>("Team", TeamSchema);
export default Team;
