import { RequestHandler } from "express";
import { User } from "../../models/User";
import { Project } from "../../models/Project";
import { recoverPersonalSignature} from "eth-sig-util"

export const RANDOM_SALT = "Please sign message to vote project. Random nonce: ";

export const getAllProjects: RequestHandler = async (req, res) => {
  const projects = await Project.find();
  res.send({ projects });
};

export const addProjects: RequestHandler = async (req, res) => {
    const projects = await Project.create(req.body.projects)
    res.send({ projects });
  };
  

export const voteProjects: RequestHandler = async (req, res) => {
  const { projectId, signature, address } = req.body;
  const project = await Project.findById(projectId);
  if (!project) {
    return res.status(404).send("Not Found");
  }
  if (project.address_votes.indexOf(address) !== -1) {
    return res.status(403).send("User already cast vote");
  }
  const user = await User.findOne({ address });
  try {
    const recoveredAddress = recoverPersonalSignature({
        data: `${RANDOM_SALT} ${user.salt}`,
        sig: signature
      });
    if (recoveredAddress.toLocaleLowerCase() !== address.toLocaleLowerCase()) {
      res.status(500).json({ message: "Wrong signature!" });
      return;
    }
    project.vote = (project.vote||0)+1;
    project.address_votes.push(address)
    project.save();
  } catch (e) {
    console.log(e);
  }

  res.send({ project });
};


export const getRandomInt = (min: number, max: number) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const getMessage: RequestHandler = async (req, res) => {
  try {
    const { address } = req.body;

    const user = await User.findOne({ address });

    if (user === null) {
      const salt = getRandomInt(1, 999999999999);
      await User.create({
        address,
        salt,
      });
      res.status(200).json({ message: `${RANDOM_SALT} ${salt}` });
    } else {
      res.status(200).json({ message: `${RANDOM_SALT} ${user.salt}` });
    }
  } catch (error) {
    //await send_telegram_message("get-message error: " +  error);
    res.status(500).json({ message: "Internal Server Error " });
  }
};
