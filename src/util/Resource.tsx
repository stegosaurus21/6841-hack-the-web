import { ExpandMore, OpenInNew } from "@mui/icons-material";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    IconButton,
    Typography,
} from "@mui/material";
import * as React from "react";

const Resource = (props: { url?: string; title: string; children: any }) => {
    return (
        <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                        gap: 1,
                        pr: 1,
                    }}
                >
                    <Typography variant="h6">{props.title}</Typography>
                    {props.url && (
                        <IconButton href={props.url} target="blank">
                            <OpenInNew />
                        </IconButton>
                    )}
                </Box>
            </AccordionSummary>
            <AccordionDetails>{props.children}</AccordionDetails>
        </Accordion>
    );
};

export default Resource;
