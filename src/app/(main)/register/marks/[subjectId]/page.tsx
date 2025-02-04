"use client";

import { GradeType, Subject, Subjects } from "@/lib/types";
import { useEffect, useState } from "react";
import { fetchMarks, fetchSubjects } from "../actions";
import { useParams } from "next/navigation";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import Gauge from "@/components/Metrics/Gauge";
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { Area, AreaChart, XAxis } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAutoAnimate } from "@formkit/auto-animate/react";


export default function Page() {
    const subjectId = useParams().subjectId;
    const [subject, setSubject] = useState<Subject>();
    const [marks, setMarks] = useState<GradeType[]>([]);

    useEffect(() => {
        async function getSubjectInfo() {
            const subjects: Subjects = await fetchSubjects();
            const subject = subjects.find(subject => subject.id.toString() === subjectId);
            setSubject(subject as Subject);
        }
        getSubjectInfo();
    }, [subjectId]);

    useEffect(() => {
        async function getSubjectMarks() {
            const marks: GradeType[] = await fetchMarks();
            const filteredMarks = marks.filter(mark => mark.subjectId.toString() === subjectId);
            setMarks(filteredMarks);
        }
        getSubjectMarks();
    }, [subjectId]);

    if (marks.length === 0) return null;
    return (
        <div className="mx-auto max-w-3xl p-4">
            <div className="mb-2 mt-2">
                <p className="text-3xl font-semibold">{subject?.description.split("-")[0]}</p>
                <p className="opacity-70 text-accent">{subject?.teachers.map(teacher => teacher.teacherName).join(", ")}</p></div>
            <div className="mt-4 mb-2">
                <p className="text-xl mb-1 font-semibold">Media</p>
                <PeriodAverages marks={marks} />
            </div>
            <div className="mt-8 mb-2">
                <p className="text-xl mb-1 font-semibold">Andamento</p>
                <TrendGraph marks={marks} />
            </div>
            <div className="mt-6 mb-2">
                <MarksDetails marks={marks} />
            </div>
        </div>
    )
}

function PeriodAverages({ marks }: { marks: GradeType[] }) {
    const periods: string[] = Array.from(new Set(marks.map(mark => mark.periodDesc)));
    const periodsMarks: GradeType[][] = periods.map(period => marks.filter(mark => mark.periodDesc === period));
    const markTypes: string[] = Array.from(new Set(marks.filter(mark => mark.color !== "blue").map(mark => mark.componentDesc))) as string[];

    return (
        <div className="relative rounded-xl overflow-hidden">
            <div className="bg-secondary -z-10 opacity-25 absolute top-0 bottom-0 left-0 right-0" />
            <Carousel className="w-full">
                <CarouselContent>
                    {periods.map((period, index) => (
                        <CarouselItem key={JSON.stringify(period)}>
                            <div className="p-4">
                                <p className="font-semibold text-center text-lg">{period}</p>
                                <div className="flex flex-wrap justify-center mt-4 gap-4">
                                    {periodsMarks && markTypes && marks && markTypes.map((markType) => (
                                        <div key={JSON.stringify(markType)} className="flex flex-col items-center">
                                            <div className="opacity-70">
                                                <Gauge
                                                    value={parseFloat((periodsMarks[index].filter(mark => mark.componentDesc === markType).reduce((acc, mark) => acc + mark.decimalValue, 0) / periodsMarks[index].filter(mark => mark.componentDesc === markType).length || 0).toFixed(3))}
                                                    size={100}
                                                    label={markType} />
                                            </div>
                                        </div>
                                    ))}
                                    <div className="">
                                        <Gauge
                                            value={parseFloat((periodsMarks[index].filter(mark => mark.color !== "blue").reduce((acc, mark) => acc + mark.decimalValue, 0) / periodsMarks[index].filter(mark => mark.color !== "blue").length || 0).toFixed(3))}
                                            size={100}
                                            label={"Generale"} /></div>
                                </div>
                            </div>
                            <div className="flex items-center justify-center gap-2 mt-1 mb-3">
                                {periods.map((period, i) => (
                                    <div key={JSON.stringify(period)} className={`w-2 h-2 rounded-full ${i === index ? 'bg-accent' : 'bg-secondary opacity-60'}`} />
                                ))}
                            </div>
                        </CarouselItem>
                    ))}

                </CarouselContent>
            </Carousel>
        </div>
    )
}

function TrendGraph({ marks }: { marks: GradeType[] }) {
    const chartConfig = {
        mark: {
            label: "Voto",
            color: "hsl(var(--chart-1))",
        },
        media: {
            label: "Media",
            color: "hsl(var(--chart-2))",
        }
    } satisfies ChartConfig;
    const averageMark = marks.filter(mark => mark.color !== "blue").reduce((acc, mark) => acc + mark.decimalValue, 0) / marks.filter(mark => mark.color !== "blue").length || 0;
    const chartData = marks.filter(mark => mark.color != "blue").map((mark) => ({
        day: mark.evtDate,
        mark: mark.decimalValue,
        media: averageMark,
    }));
    if (chartData.length > 0) {
        chartData.unshift({ ...chartData[0], day: new Date(new Date(chartData[0].day).setDate(new Date(chartData[0].day).getDate() - 1)).toLocaleDateString() });
        chartData.push({ ...chartData[chartData.length - 1], day: new Date(new Date(chartData[chartData.length - 1].day).setDate(new Date(chartData[chartData.length - 1].day).getDate() + 1)).toLocaleDateString() });
    }
    if (chartData.length === 0) return null;
    return (
        <div className="relative p-4 pb-2 px-0 rounded-xl overflow-hidden">
            <div className="bg-secondary -z-10 opacity-25 absolute top-0 bottom-0 left-0 right-0" />
            <ChartContainer config={chartConfig}>
                <AreaChart
                    accessibilityLayer
                    margin={{ top: 0, right: -10, left: -10, bottom: 0 }}
                    data={chartData}
                >
                    <XAxis
                        dataKey="day"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tick={{ fill: 'var(--accent)' }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="line" />}
                    />
                    <Area
                        dataKey="mark"
                        type="natural"
                        fill="var(--secondary)"
                        fillOpacity={0.3}
                        stroke="var(--primary)"
                        label={{ position: 'top', fill: 'var(--accent)' }}
                    />
                    <Area
                        dataKey={"media"}
                        fill="transparent"
                        stroke="var(--text)"
                        strokeDasharray="5 5"
                    />
                </AreaChart>
            </ChartContainer>
        </div>
    )
}

function MarksDetails({ marks }: { marks: GradeType[] }) {
    const [parent] = useAutoAnimate();
    const periods: string[] = Array.from(new Set(marks.map(mark => mark.periodDesc)));
    const marksByPeriod: GradeType[][] = periods.map(period => marks.filter(mark => mark.periodDesc === period).reverse());
    return (
        <Tabs defaultValue={periods[0]} className="min-h-[80svh]" >
            <div className="sticky top-0 z-10 shadow-xl pt-4 pb-2 bg-background">
                <p className="text-xl mb-1 font-semibold">Valutazioni</p>
                <TabsList className="grid w-full grid-cols-2">
                    {periods.map((period, index) => (
                        <TabsTrigger key={index} value={period}>{period}</TabsTrigger>
                    ))}
                </TabsList>
            </div>
            {periods.map((period, index) => (
                <TabsContent ref={parent} value={period} key={JSON.stringify(period)} className="p-4 overflow-hidden rounded-xl">
                    <div className="bg-secondary -z-10 opacity-15 absolute top-0 bottom-0 left-0 right-0" />
                    <div key={index} className="flex flex-col gap-7">
                        {marksByPeriod[index].map(mark => (
                            <div key={mark.evtId}>
                                <div className="flex items-center gap-2">
                                    <div>
                                        <span
                                            className={` ${mark.color === "blue"
                                                ? "bg-blue-900"
                                                : mark.decimalValue <= 5.5
                                                    ? "bg-red-600"
                                                    : mark.decimalValue <= 6.0
                                                        ? "bg-yellow-600"
                                                        : "bg-green-600"
                                                } w-14 h-14 text-xl flex rounded-full font-semibold justify-center items-center text-white`}
                                        >
                                            {mark.displayValue}
                                        </span>
                                    </div>
                                    <div className="">
                                        <p className="font-semibold">{mark.componentDesc ? mark.componentDesc : "Voto di prova"}</p>
                                        <p className="opacity-60 text-sm">{new Date(mark.evtDate).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                {mark.notesForFamily && (
                                    <div className="flex items-center mt-2 relative p-4 rounded-lg overflow-hidden">
                                        <div className="bg-secondary -z-10 opacity-30 absolute top-0 bottom-0 left-0 right-0" />
                                        <span className="whitespace-pre-wrap">{mark.notesForFamily}</span>
                                    </div>
                                )}</div>
                        ))}
                    </div>
                </TabsContent>))}
        </Tabs>
    )
}