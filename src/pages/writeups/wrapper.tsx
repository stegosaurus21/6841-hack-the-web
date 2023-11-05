import { Box, Chip, Container, Link, Typography } from "@mui/material";
import * as React from "react";
import { useNavigate } from "react-router-dom";

const difficultyColors: Record<string, "success" | "warning" | "error"> = {
    easy: "success",
    medium: "warning",
    hard: "error",
};

const WriteupsWrapper = (props: { writeup: any }) => {
    const navigate = useNavigate();
    return (
        <Container sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Link
                onClick={() => navigate(-1)}
                underline="none"
                sx={{ cursor: "pointer" }}
            >{`< Back`}</Link>
            <Typography variant="h4">{props.writeup.title}</Typography>
            <Typography variant="subtitle1">
                Challenge by:{" "}
                <Link
                    variant="subtitle1"
                    href={props.writeup.chalAuthLink}
                    target="_blank"
                >
                    {props.writeup.chalAuth}
                </Link>
            </Typography>
            <Container
                disableGutters
                sx={{
                    display: "flex",
                    gap: 1,
                    pb: 1,
                    flexWrap: "wrap",
                }}
            >
                {props.writeup.tags.map((x: string) => (
                    <Chip
                        label={x.replace(/^@/, "")}
                        color={
                            difficultyColors[x.toLowerCase()] ||
                            (x.startsWith("@") ? "primary" : "default")
                        }
                    />
                ))}
            </Container>
            <props.writeup.article />
            {props.writeup.reflection && (
                <>
                    <Typography variant="h5">Reflection & learnings</Typography>
                    <props.writeup.reflection />
                </>
            )}

            <Link
                onClick={() => window.scrollTo(0, 0)}
                underline="none"
                sx={{ cursor: "pointer" }}
            >{`^ Back to top`}</Link>
            <Box sx={{ mb: 4 }} />
        </Container>
    );
};

export default WriteupsWrapper;
