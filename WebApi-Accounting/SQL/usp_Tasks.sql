-- =============================================================================
--  STORED PROCEDURES - TASKS MODULE
--  Run these against the AyE_Services database
-- =============================================================================

-- -----------------------------------------------------------------------------
--  usp_AyE_Task_GetAll
--  Returns all active tasks with joined display names, AssignedTo (participants),
--  and ClientAccount for the list view
-- -----------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE usp_AyE_Task_GetAll
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        t.IdTask,
        t.Name,
        t.IdClient,
        t.IdTypeTask,
        t.IdEmployee,
        t.IdStatus,
        t.IdPriority,
        t.StartDateTime,
        t.DueDateTime,
        t.FiscalYear,
        ISNULL(LTRIM(RTRIM(t.State)), '1')  AS State,
        t.CreationDate,
        t.ModificationDate,
        c.Name                              AS ClientName,
        ca.AccountNumber                    AS ClientAccount,
        tt.Name                             AS TypeTask,
        tts.NameStatus                      AS StatusName,
        tm.Description                      AS PriorityName,
        g.NameGroup                         AS NameGroup,
        (
            SELECT STRING_AGG(CONCAT(ep.FirstName, ' ', ep.LastName), ', ')
            FROM   TaskPacticipants tp
            INNER  JOIN Employees ep ON tp.IdEmployee = ep.IdEmployee
            WHERE  tp.IdTask = t.IdTask
              AND  ISNULL(tp.State, 1) = 1
        )                                   AS AssignedTo
    FROM Task t
    LEFT JOIN Client           c   ON t.IdClient       = c.IdClient
    LEFT JOIN ClientAccount    ca  ON t.IdClientAccount= ca.IdClientAccount
    LEFT JOIN TypeTask         tt  ON t.IdTypeTask     = tt.IdTypeTask
    LEFT JOIN TypeTaskStatus   tts ON t.IdStatus       = tts.IdStatus
                                  AND t.IdTypeTask      = tts.IdTypeTask
    LEFT JOIN TablaMaestra     tm  ON t.IdPriority     = tm.IdTabla
                                  AND tm.Groups         = 'Priority'
    LEFT JOIN [Group]          g   ON t.IdGroup        = g.IdGroup
    WHERE LTRIM(RTRIM(t.State)) != '0'
    ORDER BY t.CreationDate DESC;
END
GO

-- -----------------------------------------------------------------------------
--  usp_AyE_Task_GetById
--  Returns full task detail for a single task including all FK IDs for form
-- -----------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE usp_AyE_Task_GetById
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        t.IdTask,
        t.Name,
        t.IdClient,
        t.IdGroup,
        t.IdTypeTask,
        t.IdEmployee,
        t.IdStatus,
        t.IdLocation,
        t.IdContact,
        t.IdPriority,
        t.IdClientAccount,
        t.IdParentTask,
        t.StartDateTime,
        t.DueDateTime,
        t.Estimate,
        t.Description,
        ISNULL(LTRIM(RTRIM(t.State)), '1')     AS State,
        t.FiscalYear,
        t.PolicyExpDate,
        t.DatePaid,
        t.IdEmployeeCreate,
        t.CreationDate,
        t.ModificationDate,
        c.Name                                 AS ClientName,
        tt.Name                                AS TypeTask,
        CONCAT(e.FirstName,  ' ', e.LastName)  AS EmployeeName,
        CONCAT(ec.FirstName, ' ', ec.LastName) AS CreatedByEmployee,
        tts.NameStatus                         AS StatusName,
        tm.Description                         AS PriorityName,
        g.NameGroup                            AS NameGroup,
        loc.Description                        AS Location,
        fy.Description                         AS FiscalYearStr,
        con.FirstName                          AS FirstNameContact,
        ca.AccountNumber                       AS ClienteAccount
    FROM Task t
    LEFT JOIN Client           c   ON t.IdClient        = c.IdClient
    LEFT JOIN TypeTask         tt  ON t.IdTypeTask       = tt.IdTypeTask
    LEFT JOIN Employees        e   ON t.IdEmployee       = e.IdEmployee
    LEFT JOIN Employees        ec  ON t.IdEmployeeCreate = ec.IdEmployee
    LEFT JOIN TypeTaskStatus   tts ON t.IdStatus         = tts.IdStatus
                                  AND t.IdTypeTask        = tts.IdTypeTask
    LEFT JOIN TablaMaestra     tm  ON t.IdPriority       = tm.IdTabla
                                  AND tm.Groups           = 'Priority'
    LEFT JOIN [Group]          g   ON t.IdGroup          = g.IdGroup
    LEFT JOIN TablaMaestra     loc ON t.IdLocation       = loc.IdTabla
                                  AND loc.Groups          = 'Location'
    LEFT JOIN TablaMaestra     fy  ON t.FiscalYear       = fy.IdTabla
                                  AND fy.Groups           = 'FiscalYear'
    LEFT JOIN Contact          con ON t.IdContact        = con.IdContact
    LEFT JOIN ClientAccount    ca  ON t.IdClientAccount  = ca.IdClientAccount
    WHERE t.IdTask = @Id;
END
GO

-- -----------------------------------------------------------------------------
--  usp_AyE_GetTypeTasksAsync
--  Returns all task types for the dropdown
-- -----------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE usp_AyE_GetTypeTasksAsync
AS
BEGIN
    SET NOCOUNT ON;
    SELECT IdTypeTask, Name
    FROM   TypeTask
    ORDER  BY Name;
END
GO

-- -----------------------------------------------------------------------------
--  usp_AyE_GetPrioritiesAsync
--  Returns priority levels from TablaMaestra (Groups = 'Priority')
-- -----------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE usp_AyE_GetPrioritiesAsync
AS
BEGIN
    SET NOCOUNT ON;
    SELECT IdTabla, Description
    FROM   TablaMaestra
    WHERE  Groups = 'Priority'
      AND  State  = '1'
    ORDER  BY [Order];
END
GO

-- -----------------------------------------------------------------------------
--  usp_AyE_Task_GetClientsDropdown
--  Returns active clients for the task form dropdown
-- -----------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE usp_AyE_Task_GetClientsDropdown
AS
BEGIN
    SET NOCOUNT ON;
    SELECT IdClient, Name
    FROM   Client
    WHERE  LTRIM(RTRIM(State)) = '1'
    ORDER  BY Name;
END
GO

-- -----------------------------------------------------------------------------
--  usp_AyE_Task_GetClientAccounts
--  Returns bank accounts belonging to a given client
-- -----------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE usp_AyE_Task_GetClientAccounts
    @IdClient INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        ca.IdClientAccount,
        ca.AccountNumber,
        ISNULL(tm.Description, 'Banco desconocido') AS BankName
    FROM ClientAccount ca
    LEFT JOIN TablaMaestra tm ON ca.IdBank = tm.IdTabla
    WHERE ca.IdClient = @IdClient
      AND LTRIM(RTRIM(ca.State)) = '1';
END
GO

-- -----------------------------------------------------------------------------
--  usp_AyE_GetLocationsCatalog
--  Returns locations from TablaMaestra (Groups = 'Location')
-- -----------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE usp_AyE_GetLocationsCatalog
AS
BEGIN
    SET NOCOUNT ON;
    SELECT IdTabla, Description
    FROM   TablaMaestra
    WHERE  Groups = 'Location'
      AND  State  = '1'
    ORDER  BY Description;
END
GO

-- -----------------------------------------------------------------------------
--  usp_AyE_GetFiscalYearsCatalog
--  Returns fiscal years from TablaMaestra (Groups = 'FiscalYear')
-- -----------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE usp_AyE_GetFiscalYearsCatalog
AS
BEGIN
    SET NOCOUNT ON;
    SELECT IdTabla, Description
    FROM   TablaMaestra
    WHERE  Groups = 'FiscalYear'
      AND  State  = '1'
    ORDER  BY Description DESC;
END
GO

-- =============================================================================
--  NOTE: The following stored procedures already exist in the original system
--  and should NOT be recreated here. The Web API calls them directly:
--
--  usp_AyE_Task               @IdTask OUTPUT, ...params..., @TIPO (1=insert, 2=update, 3=delete)
--  usp_GetStatusPorTypeTask   @IdTypeTask
--  usp_CheckMasterTableRecord @IdTypeTask, @TIPO ('ApptWith'|'DatePaid'|'Supervisor')
--  usp_GetEmployees
--  ListarGroup
--  usp_AyE_ListarComboTipoTareaPorGrupo  @IdGroup
--  ListarPeriodoTask
--  ListarClienteTask
--  usp_AyE_Listar_NumTask          @NumTask
--  usp_AyE_Listar_Entre_fechas     @FechaInicio, @FechaFin
--  usp_AyE_Listar_Por_Periodo      @Periodo
--  usp_AyE_Listar_Client_Task      @IdClient
--  usp_AyE_Add_ParticipantsTask    @IdTask, @IdEmployee
--  usp_AyE_Listar_Task_Participantes @IdTask
--  usp_AyE_Update_State_TaskParticipants @IdTask
--  SaveTaskSupervisor              @IdTask, @IdEmployee
--  usp_AyE_Listar_Task_Supervisores @IdTask
--  usp_AyE_Update_Task_Supervisors  @IdTask
--  SaveTaskAppointment             @IdTask, @IdEmployee
--  usp_AyE_Listar_Task_Citas       @IdTask
--  usp_AyE_Update_Task_Citas       @IdTask
--  sp_TaskExists                   @Name, @IdTypeTask, @IdClient
--  sp_TaskExistsUpdate             @IdTask, @Name, @IdTypeTask, @IdClient
--  usp_AyE_Contact_GetByClient     @IdClient
--  usp_TaskComment_ListByTask      @IdTask
--  usp_TaskComment_Insert          @IdComment OUTPUT, @IdTask, @IdEmployee, @Comment, @CommentDate
--  usp_TaskComment_Update          @IdComment, @Comment
--  usp_TaskComment_Delete          @IdComment
-- =============================================================================
