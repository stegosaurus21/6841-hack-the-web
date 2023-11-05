import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Chip,
    Container,
    Icon,
    Paper,
    Typography,
} from "@mui/material";
import * as React from "react";
import { ExpandMore, Phishing } from "@mui/icons-material";

const sizes: Record<
    "Small" | "Medium" | "Large",
    "success" | "warning" | "error"
> = {
    Small: "success",
    Medium: "warning",
    Large: "error",
};

const RedHerring = (props: {
    title: string;
    size: keyof typeof sizes;
    children: any;
}) => {
    return (
        <Paper elevation={3}>
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                        }}
                    >
                        <Chip
                            icon={<Phishing />}
                            color="primary"
                            label="Red herring"
                        />
                        <Typography variant="h6">{props.title}</Typography>
                        <Chip
                            size="small"
                            color={sizes[props.size] || "default"}
                            label={props.size}
                        />
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    {typeof props.children === "string" ? (
                        <Typography>{props.children}</Typography>
                    ) : (
                        <Container
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 2,
                            }}
                        >
                            {props.children}
                        </Container>
                    )}
                </AccordionDetails>
            </Accordion>
        </Paper>
    );
};

export default RedHerring;
