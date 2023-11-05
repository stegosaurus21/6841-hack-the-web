import {
    ExpandMore,
    Lightbulb,
    OpenInNew,
    Security,
} from "@mui/icons-material";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    IconButton,
    Stack,
    Typography,
} from "@mui/material";
import * as React from "react";

const Learning = (props: { title: string; dev?: boolean; children: any }) => {
    return (
        <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        width: "100%",
                        gap: 1,
                        pr: 1,
                    }}
                >
                    {props.dev ? (
                        <Lightbulb color="primary" />
                    ) : (
                        <Security color="primary" />
                    )}
                    <Typography variant="h6">{props.title}</Typography>
                </Box>
            </AccordionSummary>
            <AccordionDetails>
                <Typography>{props.children}</Typography>
            </AccordionDetails>
        </Accordion>
    );
};

export default Learning;
