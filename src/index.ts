import dotenv from "dotenv";
import express,{Request,Response,NextFunction} from "express";
import cors from "cors";

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

const app = express()

app.use(cors())
app.use(express.json())

app.use((err:Error, req:Request, res:Response, next:NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

app.get('/', (req, res) => {
  res.json({ message: 'Question Rotation System API' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
