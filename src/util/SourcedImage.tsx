import { Box, Container, Link, Paper, Typography } from "@mui/material";
import * as React from "react";

const SourcedImage = (props: {
    sourceLink?: string;
    sourceName?: string;
    caption?: string;
    height: string;
    src: string;
}) => {
    return (
        <Container sx={{ p: 1, display: "flex", justifyContent: "center" }}>
            <Box>
                <img src={props.src} style={{ height: props.height }} />
                {props.caption && (
                    <Typography sx={{ fontSize: 10 }}>
                        {props.caption}
                    </Typography>
                )}
                <Box>
                    <span style={{ fontSize: 10, fontWeight: 700 }}>
                        Source:{" "}
                    </span>
                    {props.sourceLink ? (
                        <Link
                            style={{ fontSize: 10, fontWeight: 700 }}
                            href={props.sourceLink}
                            target="_blank"
                            underline="always"
                        >
                            {props.sourceName}
                        </Link>
                    ) : (
                        <span style={{ fontSize: 10, fontWeight: 700 }}>
                            {props.sourceName || "Own screenshot"}
                        </span>
                    )}
                </Box>
            </Box>
        </Container>
    );
};

export default SourcedImage;
