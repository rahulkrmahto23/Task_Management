import mongoose, { Document, Schema, Types } from "mongoose";
import Project from "./projectSchema";
import User from "./userSchema";

export interface IAssignedMember {
  member: Types.ObjectId;
  status: "to-do" | "in-progress" | "done" | "cancelled";
}

export interface ITask extends Document {
  title: string;
  description?: string;
  deadline: Date;
  project: Types.ObjectId;
  assignedMembers: IAssignedMember[];
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema: Schema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [2, "Title must be at least 2 characters"],
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    deadline: {
      type: Date,
      required: [true, "Deadline is required"],
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project reference is required"],
    },
    assignedMembers: [
      {
        member: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: [true, "Assigned member is required"],
        },
        status: {
          type: String,
          enum: ["to-do", "in-progress", "done", "cancelled"],
          default: "to-do",
          required: true,
        },
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

TaskSchema.virtual("isOverdue").get(function () {
  return (
    this.deadline < new Date() &&
    this.assignedMembers.some(
      (m) => m.status !== "done" && m.status !== "cancelled"
    )
  );
});

TaskSchema.post("save", async function (doc) {
  await Project.findByIdAndUpdate(doc.project, {
    $addToSet: { tasks: doc._id },
  });

  const memberIds = doc.assignedMembers.map((m) => m.member);
  await User.updateMany(
    { _id: { $in: memberIds } },
    { $addToSet: { tasks: doc._id } }
  );
});

const Task = mongoose.model<ITask>("Task", TaskSchema);
export default Task;
