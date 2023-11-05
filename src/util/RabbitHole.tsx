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
import { ExpandMore, Search } from "@mui/icons-material";

const sizes: Record<
    "Shallow" | "Medium" | "Deep",
    "success" | "warning" | "error"
> = {
    Shallow: "success",
    Medium: "warning",
    Deep: "error",
};

const RabbitHole = (props: {
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
                            icon={<Search />}
                            color="secondary"
                            label="Rabbit hole"
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

export default RabbitHole;
