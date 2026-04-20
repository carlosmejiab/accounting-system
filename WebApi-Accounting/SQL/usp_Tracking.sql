-- =============================================================================
--  TRACKING MODULE — Stored Procedures
--  Run against the AyE_Services database
-- =============================================================================

-- -----------------------------------------------------------------------------
--  1. CREATE TABLE (run once)
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Tracking')
BEGIN
    CREATE TABLE Tracking (
        IdTracking        INT           IDENTITY(1,1) NOT NULL,
        IdTask            INT           NOT NULL,
        Name              NVARCHAR(200) NOT NULL,
        StartDateTime     DATETIME      NULL,
        DueDateTime       DATETIME      NULL,
        DurationTime      INT           NULL CONSTRAINT DF_Tracking_DurationTime DEFAULT 0,
        IdStatusTracking  INT           NULL,
        IdEmployee        INT           NULL,
        TrackingStart     DATETIME      NULL,
        State             NVARCHAR(1)   NOT NULL CONSTRAINT DF_Tracking_State DEFAULT '1',
        CreationDate      DATETIME      NOT NULL CONSTRAINT DF_Tracking_CreationDate DEFAULT GETDATE(),
        ModificationDate  DATETIME      NOT NULL CONSTRAINT DF_Tracking_ModificationDate DEFAULT GETDATE(),
        CONSTRAINT PK_Tracking PRIMARY KEY (IdTracking),
        CONSTRAINT FK_Tracking_Task FOREIGN KEY (IdTask) REFERENCES Task(IdTask)
    );
    PRINT 'Table Tracking created.';
END
ELSE
    PRINT 'Table Tracking already exists.';
GO

-- -----------------------------------------------------------------------------
--  2. Seed tracking statuses in TablaMaestra (if not present)
--     Adjust IdTabla values to match your existing TablaMaestra sequence.
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM TablaMaestra WHERE IdTabla = 54 AND Groups = 'MStatusTracking')
    INSERT INTO TablaMaestra (IdTabla, Groups, Description, State)
    VALUES (54, 'MStatusTracking', 'Paused', '1');

IF NOT EXISTS (SELECT 1 FROM TablaMaestra WHERE IdTabla = 55 AND Groups = 'MStatusTracking')
    INSERT INTO TablaMaestra (IdTabla, Groups, Description, State)
    VALUES (55, 'MStatusTracking', 'Working', '1');

IF NOT EXISTS (SELECT 1 FROM TablaMaestra WHERE IdTabla = 56 AND Groups = 'MStatusTracking')
    INSERT INTO TablaMaestra (IdTabla, Groups, Description, State)
    VALUES (56, 'MStatusTracking', 'Completed', '1');
GO

-- -----------------------------------------------------------------------------
--  3. usp_AyE_Tracking_GetByTask  — list all trackings for a task
-- -----------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE usp_AyE_Tracking_GetByTask
    @IdTask INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        tr.IdTracking,
        tr.IdTask,
        tr.Name,
        tr.StartDateTime,
        tr.DueDateTime,
        ISNULL(tr.DurationTime, 0)               AS DurationTime,
        tr.IdStatusTracking,
        tm.Description                            AS Status,
        tr.IdEmployee,
        CONCAT(e.FirstName, ' ', e.LastName)      AS EmployeeName,
        ISNULL(LTRIM(RTRIM(tr.State)), '1')       AS State,
        tr.CreationDate
    FROM  Tracking   tr
    LEFT  JOIN TablaMaestra tm ON tr.IdStatusTracking = tm.IdTabla
                               AND tm.Groups = 'MStatusTracking'
    LEFT  JOIN Employees    e  ON tr.IdEmployee = e.IdEmployee
    WHERE tr.IdTask = @IdTask
      AND ISNULL(LTRIM(RTRIM(tr.State)), '1') != '0'
    ORDER BY tr.CreationDate ASC;
END
GO

-- -----------------------------------------------------------------------------
--  4. usp_AyE_Tracking  — insert/update (TIPO=1 INSERT)
-- -----------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE usp_AyE_Tracking
    @IdTracking        INT,
    @IdTask            INT,
    @Name              NVARCHAR(200),
    @StartDateTime     DATETIME,
    @DueDateTime       DATETIME,
    @IdEmployee        INT,
    @IdStatusTracking  INT,
    @State             NVARCHAR(1),
    @TIPO              TINYINT        -- 1=INSERT
AS
BEGIN
    SET NOCOUNT ON;
    IF @TIPO = 1
    BEGIN
        INSERT INTO Tracking
            (IdTask, Name, StartDateTime, DueDateTime, DurationTime,
             IdStatusTracking, IdEmployee, State, CreationDate, ModificationDate)
        VALUES
            (@IdTask, @Name, @StartDateTime, @DueDateTime, 0,
             @IdStatusTracking, @IdEmployee, @State, GETDATE(), GETDATE());

        SELECT CAST(SCOPE_IDENTITY() AS INT);
    END
END
GO

-- -----------------------------------------------------------------------------
--  5. usp_AyE_Tracking_Play  — set status to Working (55), record start time
-- -----------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE usp_AyE_Tracking_Play
    @IdTracking INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Tracking
    SET    IdStatusTracking = 55,          -- Working
           TrackingStart    = GETDATE(),
           ModificationDate = GETDATE()
    WHERE  IdTracking = @IdTracking;
END
GO

-- -----------------------------------------------------------------------------
--  6. usp_AyE_Tracking_Pause  — set status to Paused (54), accumulate time
-- -----------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE usp_AyE_Tracking_Pause
    @IdTracking    INT,
    @MinutesWorked INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Tracking
    SET    IdStatusTracking = 54,                                    -- Paused
           DurationTime     = ISNULL(DurationTime, 0) + @MinutesWorked,
           ModificationDate = GETDATE()
    WHERE  IdTracking = @IdTracking;
END
GO

-- -----------------------------------------------------------------------------
--  7. usp_AyE_Tracking_Stop  — set status to Completed (56), save final time
-- -----------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE usp_AyE_Tracking_Stop
    @IdTracking    INT,
    @MinutesWorked INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Tracking
    SET    IdStatusTracking = 56,                                    -- Completed
           DurationTime     = ISNULL(DurationTime, 0) + @MinutesWorked,
           ModificationDate = GETDATE()
    WHERE  IdTracking = @IdTracking;
END
GO

-- -----------------------------------------------------------------------------
--  8. usp_AyE_Tracking_GetStatuses  — dropdown for tracking status
-- -----------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE usp_AyE_Tracking_GetStatuses
AS
BEGIN
    SET NOCOUNT ON;
    SELECT IdTabla, Description
    FROM   TablaMaestra
    WHERE  Groups = 'MStatusTracking'
      AND  ISNULL(State, '1') = '1'
    ORDER  BY IdTabla;
END
GO

-- -----------------------------------------------------------------------------
--  9. usp_AyE_Tracking_GetEmployees  — active employees for Assigned To dropdown
-- -----------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE usp_AyE_Tracking_GetEmployees
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        IdEmployee,
        CONCAT(FirstName, ' ', LastName) AS FullName
    FROM   Employees
    WHERE  ISNULL(LTRIM(RTRIM(State)), '1') = '1'
    ORDER  BY FirstName, LastName;
END
GO
