import mongoose, { Document, Schema, Types } from "mongoose";
import Team from "./teamSchema";
import User from "./userSchema";

export interface IProject extends Document {
  name: string;
  description?: string;
  members: Types.ObjectId[];
  team: Types.ObjectId;
  tasks: Types.ObjectId[];
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema: Schema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
      minlength: [2, "Project name must be at least 2 characters"],
      maxlength: [100, "Project name cannot exceed 100 characters"],
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
    team: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      required: [true, "Project must belong to a team"],
    },
    tasks: [
      {
        type: Schema.Types.ObjectId,
        ref: "Task",
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

ProjectSchema.virtual("taskCount").get(function () {
  return Array.isArray(this.tasks) ? this.tasks.length : 0;
});

ProjectSchema.post("save", async function (doc) {
  await Team.findByIdAndUpdate(doc.team, { $addToSet: { projects: doc._id } });

  await User.updateMany(
    { _id: { $in: doc.members } },
    { $addToSet: { projects: doc._id } }
  );
});

const Project = mongoose.model<IProject>("Project", ProjectSchema);
export default Project;
