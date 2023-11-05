import {
    Card,
    CardActionArea,
    CardMedia,
    Chip,
    Container,
    Typography,
} from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import * as React from "react";
import { Link, useNavigate } from "react-router-dom";

const difficultyColors: Record<string, "success" | "warning" | "error"> = {
    easy: "success",
    medium: "warning",
    hard: "error",
};

const IndexCard = (props: {
    title: string;
    children: any;
    link: string;
    img?: string;
    tags?: string[];
}) => {
    const navigate = useNavigate();
    return (
        <Grid xs={4}>
            <CardActionArea
                onClick={() => setTimeout(() => navigate(props.link), 250)}
            >
                {props.img && <CardMedia component="img" image={props.img} />}
                <Card sx={{ p: 2, height: "20vh" }}>
                    <Typography variant="h5" gutterBottom>
                        {props.title}
                    </Typography>
                    {props.tags && (
                        <Container
                            disableGutters
                            sx={{
                                display: "flex",
                                gap: 1,
                                pb: 2,
                                flexWrap: "wrap",
                            }}
                        >
                            {props.tags.map((x) => (
                                <Chip
                                    label={x.replace(/^@/, "")}
                                    color={
                                        difficultyColors[x.toLowerCase()] ||
                                        (x.startsWith("@")
                                            ? "primary"
                                            : "default")
                                    }
                                />
                            ))}
                        </Container>
                    )}
                    <Typography>{props.children}</Typography>
                </Card>
            </CardActionArea>
        </Grid>
    );
};

export default IndexCard;
