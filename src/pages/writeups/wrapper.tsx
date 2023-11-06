import {
    Box,
    Card,
    CardActionArea,
    Chip,
    Container,
    Link,
    Typography,
} from "@mui/material";
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { writeups } from ".";
import { ArrowBack, ArrowForward } from "@mui/icons-material";
import LinkInternal from "~util/LinkInternal";

const difficultyColors: Record<string, "success" | "warning" | "error"> = {
    easy: "success",
    medium: "warning",
    hard: "error",
};

const WriteupsWrapper = (props: { writeup: any }) => {
    const navigate = useNavigate();
    const index = writeups.indexOf(props.writeup);
    return (
        <Container sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Link
                onClick={() => {
                    window.scrollTo(0, 0);
                    navigate(-1);
                }}
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
            <Box
                sx={{ mb: 4, display: "flex", justifyContent: "space-between" }}
            >
                {index > 0 ? (
                    <CardActionArea
                        sx={{ width: "30%" }}
                        onClick={() =>
                            setTimeout(() => {
                                window.scrollTo(0, 0);
                                navigate(
                                    `/writeups/${writeups[index - 1].path}`
                                );
                            }, 250)
                        }
                    >
                        <Card sx={{ p: 2 }}>
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 2,
                                }}
                            >
                                <ArrowBack />
                                <Box>
                                    <Typography>Previous writeup:</Typography>
                                    <Typography variant="h6">
                                        {writeups[index - 1].title}
                                    </Typography>
                                </Box>
                            </Box>
                        </Card>
                    </CardActionArea>
                ) : (
                    <Box />
                )}
                {index < writeups.length - 1 && (
                    <CardActionArea
                        sx={{ width: "30%" }}
                        onClick={() =>
                            setTimeout(() => {
                                window.scrollTo(0, 0);
                                navigate(
                                    `/writeups/${writeups[index + 1].path}`
                                );
                            }, 250)
                        }
                    >
                        <Card sx={{ p: 2 }}>
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "flex-end",
                                    gap: 2,
                                }}
                            >
                                <Box>
                                    <Typography sx={{ textAlign: "right" }}>
                                        Next writeup:
                                    </Typography>
                                    <Typography
                                        sx={{ textAlign: "right" }}
                                        variant="h6"
                                    >
                                        {writeups[index + 1].title}
                                    </Typography>
                                </Box>
                                <ArrowForward />
                            </Box>
                        </Card>
                    </CardActionArea>
                )}
            </Box>
        </Container>
    );
};

export default WriteupsWrapper;
